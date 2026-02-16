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
const VALID_TIME_SLOTS = ["morning", "afternoon", "evening"];

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  new_inventory: "New Inventory",
  check_in: "Check-In",
  check_out: "Check-Out",
  mid_term: "Mid-Term",
  interim: "Interim",
};

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "Morning (9:00 - 12:00)",
  afternoon: "Afternoon (12:00 - 17:00)",
  evening: "Evening (17:00 - 20:00)",
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
    const timeSlot = typeof body.timeSlot === "string" ? body.timeSlot.trim() : undefined;

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

    if (timeSlot && !VALID_TIME_SLOTS.includes(timeSlot)) {
      return new Response(JSON.stringify({ error: "Invalid time slot" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Notifying clerks about new job:", jobId);

    // Verify the caller owns this job
    const userId = claimsData.claims.sub;
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("client_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job || job.client_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: clerkRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "clerk");

    if (rolesError) {
      console.error("Error fetching clerk roles:", rolesError);
      throw new Error("Failed to fetch clerk roles");
    }

    if (!clerkRoles || clerkRoles.length === 0) {
      console.log("No clerks found to notify");
      return new Response(
        JSON.stringify({ message: "No clerks to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const clerkUserIds = clerkRoles.map((r) => r.user_id);

    const { data: optedOutPrefs } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .in("user_id", clerkUserIds)
      .eq("email_job_updates", false);

    const optedOutIds = new Set((optedOutPrefs || []).map((p: any) => p.user_id));
    const eligibleClerkIds = clerkUserIds.filter((id: string) => !optedOutIds.has(id));

    if (eligibleClerkIds.length === 0) {
      console.log("All clerks have opted out of email_job_updates");
      return new Response(
        JSON.stringify({ message: "All clerks opted out" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch user emails");
    }

    const clerkEmails = users
      .filter((user) => eligibleClerkIds.includes(user.id) && user.email)
      .map((user) => user.email!);

    if (clerkEmails.length === 0) {
      console.log("No clerk emails found");
      return new Response(
        JSON.stringify({ message: "No clerk emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending notifications to ${clerkEmails.length} clerks`);

    const formattedDate = new Date(scheduledDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const inspectionLabel = INSPECTION_TYPE_LABELS[inspectionType] || inspectionType;
    const timeSlotLabel = timeSlot ? TIME_SLOT_LABELS[timeSlot] : "Flexible";

    // Escape all user-provided values for HTML
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
        to: clerkEmails,
        subject: `New Job Available: ${escapeHtml(inspectionLabel)} in ${safeCity}`,
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
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">New Job Available!</h1>
                </div>
                
                <p style="color: #52525b; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                  A new inspection job has been published and is available for you to accept.
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
                      <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Date:</td>
                      <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${escapeHtml(formattedDate)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Time Slot:</td>
                      <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${escapeHtml(timeSlotLabel)}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="text-align: center;">
                  <a href="https://listd.co.uk/dashboard" 
                     style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View Available Jobs
                  </a>
                </div>
                
                <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 32px;">
                  This job is available to all clerks on a first-come, first-served basis.
                </p>
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
    console.log("Email notification sent:", emailResult);

    await supabase.from("email_logs").insert(
      clerkEmails.map((e: string) => ({
        function_name: "notify-job-published",
        recipient_email: e,
        subject: `New Job Available: ${inspectionLabel} in ${city}`,
        status: emailResponse.ok ? "sent" : "failed",
        resend_id: emailResult?.id || null,
        metadata: { jobId, inspectionType, city, postcode },
      }))
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifiedCount: clerkEmails.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-job-published function:", error);
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
