import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId } = await req.json();
    if (!jobId) throw new Error("Missing jobId");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch job with property
    const { data: job, error: jobErr } = await supabaseAdmin
      .from("jobs")
      .select("*, property:properties(address_line_1, address_line_2, city, postcode)")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) throw new Error("Job not found");
    if (job.inspection_type !== "check_in") {
      return new Response(JSON.stringify({ message: "Not a check-in job, skipping" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch tenant details
    const { data: tenants } = await supabaseAdmin
      .from("tenant_details")
      .select("*")
      .eq("job_id", jobId)
      .order("tenant_order", { ascending: true });

    if (!tenants || tenants.length === 0) {
      return new Response(JSON.stringify({ message: "No tenant details found, skipping" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    const property = job.property;
    const address = property
      ? `${property.address_line_1}${property.address_line_2 ? ", " + property.address_line_2 : ""}, ${property.city}, ${property.postcode}`
      : "Your property";

    const scheduledDate = new Date(job.scheduled_date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const emailsSent: string[] = [];

    for (const tenant of tenants) {
      if (!tenant.email) continue;

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #1a1a1a; font-size: 22px; margin-bottom: 8px;">Check-In Confirmation</h1>
          <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
            Hello${tenant.full_name ? " " + tenant.full_name : ""}, your check-in inspection has been confirmed.
          </p>

          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #888; font-size: 13px; width: 120px;">Property</td>
                <td style="padding: 6px 0; color: #1a1a1a; font-size: 13px; font-weight: 500;">${address}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #888; font-size: 13px;">Date</td>
                <td style="padding: 6px 0; color: #1a1a1a; font-size: 13px; font-weight: 500;">${scheduledDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #888; font-size: 13px;">Inspection Type</td>
                <td style="padding: 6px 0; color: #1a1a1a; font-size: 13px; font-weight: 500;">Check-In</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 24px;">
            <h2 style="color: #1a1a1a; font-size: 16px; margin-bottom: 8px;">What to Expect</h2>
            <p style="color: #555; font-size: 13px; line-height: 1.6;">
              A LISTD inventory clerk will attend the property on the scheduled date to conduct a thorough check-in inspection. 
              This involves documenting the condition of each room, fixtures, fittings, and any furnishings. 
              The inspection typically takes between 1–3 hours depending on the size of the property.
            </p>
            <p style="color: #555; font-size: 13px; line-height: 1.6; margin-top: 8px;">
              Please ensure access to the property is available at the scheduled time. If you have any questions 
              or need to make changes, please contact us as soon as possible.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e5e5; padding-top: 16px; margin-top: 24px;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              LISTD — Property Inventory Services<br/>
              Email: hello@listd.co.uk<br/>
              Website: listd.co.uk
            </p>
          </div>
        </div>
      `;

      const { error: sendErr } = await resend.emails.send({
        from: "LISTD <notifications@listd.co.uk>",
        to: [tenant.email],
        subject: `Check-In Confirmed — ${property?.address_line_1 || "Your Property"}`,
        html,
      });

      if (sendErr) {
        console.error(`Failed to send to ${tenant.email}:`, sendErr);
      } else {
        emailsSent.push(tenant.email);
      }

      // Log email
      await supabaseAdmin.from("email_logs").insert({
        function_name: "notify-tenant-checkin",
        recipient_email: tenant.email,
        subject: `Check-In Confirmed — ${property?.address_line_1 || "Your Property"}`,
        status: sendErr ? "failed" : "sent",
        error_message: sendErr ? JSON.stringify(sendErr) : null,
        metadata: { job_id: jobId, tenant_order: tenant.tenant_order },
      });
    }

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in notify-tenant-checkin:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
