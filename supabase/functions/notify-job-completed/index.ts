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

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  new_inventory: "New Inventory",
  check_in: "Check-In",
  check_out: "Check-Out",
  mid_term: "Mid-Term",
  interim: "Interim",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";

    if (!jobId || !UUID_REGEX.test(jobId)) {
      return new Response(
        JSON.stringify({ error: "Invalid job ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch job + property
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id, client_id, clerk_id, inspection_type, scheduled_date, report_url,
        property:properties(address_line_1, city, postcode)
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Job not found:", jobError);
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client email
    const { data: { user: clientUser }, error: clientAuthError } = await supabase.auth.admin.getUserById(job.client_id);
    if (clientAuthError || !clientUser?.email) {
      return new Response(
        JSON.stringify({ error: "Client email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client name
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", job.client_id)
      .maybeSingle();

    // Fetch Trustpilot review link from platform_settings
    const { data: trustpilotSetting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "trustpilot_review_link")
      .single();
    const trustpilotLink = trustpilotSetting?.value || "";

    // Fetch Google review link as fallback
    const { data: googleSetting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "google_review_link")
      .single();
    const googleReviewLink = googleSetting?.value || "";

    const clientEmail = clientUser.email;
    const clientName = clientProfile?.full_name || "";
    const prop = job.property as { address_line_1: string; city: string; postcode: string };
    const propertyAddress = prop?.address_line_1 || "";
    const city = prop?.city || "";
    const postcode = prop?.postcode || "";
    const inspectionType = job.inspection_type || "";
    const reportUrl = job.report_url || "";

    const inspectionLabel = INSPECTION_TYPE_LABELS[inspectionType] || inspectionType;
    const formattedDate = job.scheduled_date
      ? new Date(job.scheduled_date).toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        })
      : "—";

    const dashboardUrl = `https://listd.co.uk/dashboard/jobs/${jobId}`;
    const year = new Date().getFullYear();

    const safeClientName = escapeHtml(clientName || "there");
    const safeAddress = escapeHtml(propertyAddress);
    const safeCity = escapeHtml(city);
    const safePostcode = escapeHtml(postcode);
    const safeInspectionLabel = escapeHtml(inspectionLabel);
    const safeFormattedDate = escapeHtml(formattedDate);

    const subject = `Your inspection is complete – ${safeAddress}`;

    // Build review section (Trustpilot preferred, Google fallback)
    let reviewSection = "";
    if (trustpilotLink) {
      reviewSection = `
        <div style="text-align: center; margin-bottom: 16px;">
          <a href="${escapeHtml(trustpilotLink)}" target="_blank" style="display: inline-block; background-color: #00b67a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Leave a Trustpilot Review ⭐
          </a>
        </div>
      `;
    }
    if (googleReviewLink) {
      reviewSection += `
        <div style="text-align: center; margin-bottom: 16px;">
          <a href="${escapeHtml(googleReviewLink)}" target="_blank" style="display: inline-block; color: #0d9488; text-decoration: underline; font-size: 13px;">
            Leave a Google Review
          </a>
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

            <div style="text-align: center; margin-bottom: 28px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background-color: #f0fdf4; border-radius: 50%; margin-bottom: 16px;">
                <span style="font-size: 28px;">✅</span>
              </div>
              <h1 style="color: #18181b; font-size: 22px; margin: 0 0 8px 0;">Your Inspection is Complete</h1>
              <p style="color: #71717a; font-size: 15px; margin: 0;">Hi ${safeClientName}, your inspection has been completed successfully.</p>
            </div>

            <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h2 style="color: #18181b; font-size: 15px; font-weight: 600; margin: 0 0 14px 0;">Job Summary</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #71717a; font-size: 14px; width: 40%;">Type:</td><td style="padding: 6px 0; color: #18181b; font-size: 14px; font-weight: 600;">${safeInspectionLabel}</td></tr>
                <tr><td style="padding: 6px 0; color: #71717a; font-size: 14px;">Property:</td><td style="padding: 6px 0; color: #18181b; font-size: 14px;">${safeAddress}</td></tr>
                <tr><td style="padding: 6px 0; color: #71717a; font-size: 14px;">Location:</td><td style="padding: 6px 0; color: #18181b; font-size: 14px;">${safeCity}, ${safePostcode}</td></tr>
                <tr><td style="padding: 6px 0; color: #71717a; font-size: 14px;">Date:</td><td style="padding: 6px 0; color: #18181b; font-size: 14px;">${safeFormattedDate}</td></tr>
              </table>
            </div>

            ${reportUrl ? `
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${escapeHtml(reportUrl)}" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                View Your Report
              </a>
            </div>
            ` : `
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                View Job Details
              </a>
            </div>
            `}

            ${reviewSection ? `
            <div style="border-top: 1px solid #f4f4f5; padding-top: 20px; margin-bottom: 8px;">
              <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0 0 16px;">
                Happy with the service? We'd love to hear from you!
              </p>
              ${reviewSection}
            </div>
            ` : ""}

            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #f4f4f5; padding-top: 16px;">
              If you have any questions, please contact us at <a href="mailto:hello@listd.co.uk" style="color: #0d9488;">hello@listd.co.uk</a>
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #a1a1aa; font-size: 12px;">&copy; ${year} LISTD. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending job-completed notification to ${clientEmail} for job ${jobId}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "LISTD <notifications@listd.co.uk>",
        to: [clientEmail],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Job completed notification sent:", emailResult);

    // Log the email
    await supabase.from("email_logs").insert({
      function_name: "notify-job-completed",
      recipient_email: clientEmail,
      subject,
      status: emailResponse.ok ? "sent" : "failed",
      resend_id: emailResult?.id || null,
      error_message: emailResponse.ok ? null : JSON.stringify(emailResult),
      metadata: { jobId, inspectionType, propertyAddress, city },
    });

    return new Response(
      JSON.stringify({ success: emailResponse.ok, id: emailResult?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-job-completed:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
