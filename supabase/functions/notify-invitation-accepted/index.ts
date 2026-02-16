import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
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

    const body = await req.json();
    const providerId = typeof body.providerId === "string" ? body.providerId.trim() : "";
    const clerkName = typeof body.clerkName === "string" ? body.clerkName.trim().slice(0, 255) : "";
    const clerkEmail = typeof body.clerkEmail === "string" ? body.clerkEmail.trim() : "";

    // Validate inputs
    if (!providerId || !UUID_REGEX.test(providerId)) {
      return new Response(JSON.stringify({ error: "Invalid provider ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!clerkEmail || !isValidEmail(clerkEmail)) {
      return new Response(JSON.stringify({ error: "Invalid clerk email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: providerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, company_name")
      .eq("user_id", providerId)
      .single();

    if (profileError) {
      console.error("Error fetching provider profile:", profileError);
      throw new Error("Could not fetch provider profile");
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(providerId);

    if (userError || !userData?.user?.email) {
      console.error("Error fetching provider email:", userError);
      throw new Error("Could not fetch provider email");
    }

    const { data: prefData } = await supabaseAdmin
      .from("notification_preferences")
      .select("email_job_updates")
      .eq("user_id", providerId)
      .single();

    if (prefData && prefData.email_job_updates === false) {
      console.log("Provider has opted out of email_job_updates, skipping email");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const providerEmail = userData.user.email;
    const safeProviderName = escapeHtml(providerProfile?.full_name || providerProfile?.company_name || "Provider");
    const safeClerkName = escapeHtml(clerkName || clerkEmail);
    const safeClerkEmail = escapeHtml(clerkEmail);

    console.log(`Sending acceptance notification to provider about clerk`);

    const emailResponse = await resend.emails.send({
      from: "LISTD <noreply@resend.dev>",
      to: [providerEmail],
      subject: `A clerk has joined your team!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Team Member!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${safeProviderName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! <strong>${safeClerkName}</strong> has accepted your invitation and joined your team on LISTD.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">New Clerk Details:</p>
              <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 600;">${safeClerkName}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${safeClerkEmail}</p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              You can now assign inspection jobs to this clerk from your dashboard.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://listd.co.uk/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
              The LISTD Team
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Acceptance notification email sent successfully:", emailResponse);

    await supabaseAdmin.from("email_logs").insert({
      function_name: "notify-invitation-accepted",
      recipient_email: providerEmail,
      subject: "A clerk has joined your team!",
      status: emailResponse?.id ? "sent" : "failed",
      resend_id: emailResponse?.id || null,
      metadata: { providerId },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-invitation-accepted function:", error);
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
