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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const providerName = typeof body.providerName === "string" ? body.providerName.trim().slice(0, 255) : "";
    const inviteToken = typeof body.inviteToken === "string" ? body.inviteToken.trim() : "";

    // Validate inputs
    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!inviteToken || !UUID_REGEX.test(inviteToken)) {
      return new Response(JSON.stringify({ error: "Invalid invite token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://listd.co.uk";
    const inviteUrl = `${origin}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
    const safeProviderName = escapeHtml(providerName || "An inventory provider");

    const emailResponse = await resend.emails.send({
      from: "LISTD <noreply@resend.dev>",
      to: [email],
      subject: `${safeProviderName} has invited you to join their team on LISTD`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin-bottom: 10px;">You're Invited!</h1>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${safeProviderName}</strong> has invited you to join their team as an Inventory Clerk on LISTD.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
              As a clerk, you'll be able to conduct property inspections, capture photos, and submit detailed inventory reports.
            </p>
            
            <div style="text-align: center;">
              <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background: #0066FF; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
          </div>
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              &copy; ${new Date().getFullYear()} LISTD. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Clerk invitation email sent successfully:", emailResponse);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await supabaseAdmin.from("email_logs").insert({
      function_name: "send-clerk-invite",
      recipient_email: email,
      subject: `Clerk invitation sent`,
      status: emailResponse?.id ? "sent" : "failed",
      resend_id: emailResponse?.id || null,
      metadata: { inviteToken },
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending clerk invitation:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An internal error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
