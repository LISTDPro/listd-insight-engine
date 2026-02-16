import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_INSPECTION_TYPES = ["new_inventory", "check_in", "check_out", "mid_term", "interim"];

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  new_inventory: "New Inventory",
  check_in: "Check-In",
  check_out: "Check-Out",
  mid_term: "Mid-Term",
  interim: "Interim",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // Validate inputs
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    const propertyAddress = typeof body.propertyAddress === "string" ? body.propertyAddress.trim().slice(0, 500) : "";
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 100) : "";
    const postcode = typeof body.postcode === "string" ? body.postcode.trim().slice(0, 20) : "";
    const inspectionType = typeof body.inspectionType === "string" ? body.inspectionType.trim() : "";
    const scheduledDate = typeof body.scheduledDate === "string" ? body.scheduledDate.trim() : "";
    const clientName = typeof body.clientName === "string" ? body.clientName.trim().slice(0, 255) : "";

    if (!jobId || !UUID_REGEX.test(jobId)) {
      return new Response(JSON.stringify({ error: "Invalid job ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!VALID_INSPECTION_TYPES.includes(inspectionType)) {
      return new Response(JSON.stringify({ error: "Invalid inspection type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!scheduledDate || isNaN(Date.parse(scheduledDate))) {
      return new Response(JSON.stringify({ error: "Invalid scheduled date" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Notifying about pre-inspection acknowledgement for job:", jobId);

    const userId = claimsData.claims.sub;
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("clerk_id, provider_id, client_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job || job.client_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientIds: string[] = [];
    if (job.clerk_id) recipientIds.push(job.clerk_id);
    if (job.provider_id) recipientIds.push(job.provider_id);

    if (recipientIds.length === 0) {
      const { data: clerkRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "clerk");

      if (clerkRoles) {
        recipientIds.push(...clerkRoles.map((r) => r.user_id));
      }
    }

    if (recipientIds.length === 0) {
      console.log("No recipients found to notify");
      return new Response(
        JSON.stringify({ message: "No recipients to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: optedOutPrefs } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .in("user_id", recipientIds)
      .eq("email_job_updates", false);

    const optedOutIds = new Set((optedOutPrefs || []).map((p: any) => p.user_id));
    const eligibleIds = recipientIds.filter((id: string) => !optedOutIds.has(id));

    if (eligibleIds.length === 0) {
      console.log("All recipients opted out of email_job_updates");
      return new Response(
        JSON.stringify({ message: "All recipients opted out" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch user emails");
    }

    const recipientEmails = users
      .filter((user) => eligibleIds.includes(user.id) && user.email)
      .map((user) => user.email!);

    if (recipientEmails.length === 0) {
      console.log("No recipient emails found");
      return new Response(
        JSON.stringify({ message: "No recipient emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending pre-inspection ack notifications to ${recipientEmails.length} recipients`);

    const formattedDate = new Date(scheduledDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const inspectionLabel = INSPECTION_TYPE_LABELS[inspectionType] || inspectionType;

    // Escape all user-provided values
    const safeClientName = escapeHtml(clientName || "The client");
    const safePropertyAddress = escapeHtml(propertyAddress);
    const safeCity = escapeHtml(city);
    const safePostcode = escapeHtml(postcode);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "LISTD <notifications@listd.co.uk>",
        to: recipientEmails,
        subject: `Job Confirmed: ${escapeHtml(inspectionLabel)} at ${safeCity}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="display: inline-block; background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                    ✓ Client Confirmed
                  </div>
                  <h1 style="color: #18181b; font-size: 24px; margin: 16px 0 0 0;">Pre-Inspection Details Verified</h1>
                </div>
                
                <p style="color: #52525b; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                  <strong>${safeClientName}</strong> has confirmed that all property details are accurate and the job is ready to proceed.
                </p>
                
                <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <h2 style="color: #18181b; font-size: 18px; margin: 0 0 16px 0;">Job Details</h2>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Type:</td>
                      <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${escapeHtml(inspectionLabel)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Property:</td>
                      <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${safePropertyAddress}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Location:</td>
                      <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${safeCity}, ${safePostcode}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Scheduled:</td>
                      <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${escapeHtml(formattedDate)}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="color: #065f46; font-size: 14px; margin: 0;">
                    <strong>What this means:</strong> The client has verified the property details, room counts, and confirmed access arrangements. You can proceed with confidence.
                  </p>
                </div>
                
                <div style="text-align: center;">
                  <a href="https://listd.co.uk/dashboard" 
                     style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View Job Details
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <p style="color: #a1a1aa; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} LISTD. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Pre-inspection ack notification sent:", emailResult);

    await supabase.from("email_logs").insert(
      recipientEmails.map((e: string) => ({
        function_name: "notify-pre-inspection-ack",
        recipient_email: e,
        subject: `Job Confirmed: ${inspectionLabel} at ${city}`,
        status: emailResponse.ok ? "sent" : "failed",
        resend_id: emailResult?.id || null,
        metadata: { jobId, inspectionType, city },
      }))
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifiedCount: recipientEmails.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-pre-inspection-ack function:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
