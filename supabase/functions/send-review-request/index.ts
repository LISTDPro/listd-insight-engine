import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if review emails are enabled
    const { data: settingRow } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "review_email_enabled")
      .single();

    if (settingRow?.value !== "true") {
      return new Response(JSON.stringify({ message: "Review emails disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Google review link
    const { data: linkRow } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "google_review_link")
      .single();
    const reviewLink = linkRow?.value || "https://g.page/r/CfNpNpoSIt-1EAI/review";

    // Find jobs where client_report_accepted = true, accepted 24h+ ago, review email not yet sent
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from("jobs")
      .select("id, client_id, client_report_accepted_at, property_id")
      .eq("client_report_accepted", true)
      .is("review_email_sent_at", null)
      .lte("client_report_accepted_at", cutoff);

    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No pending review emails", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    let sent = 0;

    for (const job of jobs) {
      // Get client email from auth
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const clientUser = users.find((u: any) => u.id === job.client_id);
      const clientEmail = clientUser?.email;
      if (!clientEmail) continue;

      // Get property address
      const { data: property } = await supabaseAdmin
        .from("properties")
        .select("address_line_1, city")
        .eq("id", job.property_id)
        .single();

      const address = property ? `${property.address_line_1}, ${property.city}` : "your property";

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LISTD <notifications@listd.co.uk>",
          to: [clientEmail],
          subject: "Quick favour?",
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; padding: 40px 20px;">
              <div style="margin-bottom: 32px;">
                <img src="https://listd-insight-engine.lovable.app/favicon.png" alt="LISTD" style="height: 32px;" />
              </div>
              <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 16px;">Quick favour?</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0 0 12px;">
                Thank you for using LISTD for your recent inspection at <strong>${address}</strong>.
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0 0 24px;">
                If you were happy with the service, we'd really appreciate a quick Google review. Your feedback helps us grow and continue delivering reliable inspection services.
              </p>
              <a href="${reviewLink}" target="_blank" style="display: inline-block; background: #2D6A4F; color: white; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 500;">
                Leave a Google Review ⭐
              </a>
              <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                LISTD · Professional Inventory Services<br/>
                <a href="https://listd.co.uk" style="color: #999;">listd.co.uk</a>
              </p>
            </div>
          `,
        }),
      });

      if (emailRes.ok) {
        // Mark as sent
        await supabaseAdmin
          .from("jobs")
          .update({ review_email_sent_at: new Date().toISOString() } as any)
          .eq("id", job.id);

        // Log the email
        await supabaseAdmin.from("email_logs").insert({
          function_name: "send-review-request",
          recipient_email: clientEmail,
          subject: "Quick favour?",
          status: "sent",
          metadata: { job_id: job.id },
        });

        sent++;
      }
    }

    return new Response(JSON.stringify({ message: `Sent ${sent} review request emails`, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-review-request error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
