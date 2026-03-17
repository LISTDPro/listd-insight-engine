import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_REDIRECT_HOSTS = [
  "listd.co.uk",
  "www.listd.co.uk",
  "listd.app",
  "listdcouk.lovable.app",
  "listd-insight-engine.lovable.app",
  "localhost",
];

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_REDIRECT_HOSTS.some(
    (h) =>
      hostname === h ||
      hostname.endsWith(".lovableproject.com") ||
      hostname.endsWith(".lovable.app")
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Password reset request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(apiKey);

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const redirectUrl =
      typeof body.redirectUrl === "string" ? body.redirectUrl.trim() : "";

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!redirectUrl) {
      return new Response(JSON.stringify({ error: "Missing redirectUrl" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    try {
      const parsedUrl = new URL(redirectUrl);
      if (!isAllowedHost(parsedUrl.hostname)) {
        console.error("Rejected redirect URL:", parsedUrl.hostname);
        return new Response(
          JSON.stringify({ error: "Invalid redirect URL" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid redirect URL format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Processing password reset for:", email);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error: resetError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: { redirectTo: redirectUrl },
      });

    if (resetError) {
      console.error("Reset link generation failed:", resetError.message);
      // Return success to avoid leaking whether email exists
      await supabaseAdmin.from("email_logs").insert({
        function_name: "send-password-reset",
        recipient_email: email,
        subject: "Reset your LISTD password",
        status: "failed",
        resend_id: null,
        error_message: "Link generation failed: " + resetError.message,
        metadata: {},
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resetLink = data?.properties?.action_link;

    if (!resetLink) {
      console.error("No action_link in response. Data:", JSON.stringify(data));
      throw new Error("Failed to generate reset link — no action_link returned");
    }

    console.log("Reset link generated successfully");

    // Do NOT escapeHtml the link — it corrupts & in query params.
    // The link is inserted into an href attribute, which is safe.
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "LISTD <hello@listd.co.uk>",
      to: [email],
      subject: "Reset your LISTD password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">LISTD</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="margin: 0 0 16px 0; color: #0F172A; font-size: 20px; font-weight: 600;">Reset Your Password</h2>
                      <p style="margin: 0 0 24px 0; color: #64748B; font-size: 15px; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to choose a new password.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 24px 0;">
                            <a href="${resetLink}" style="display: inline-block; background-color: #F59E0B; color: #0F172A; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0 0 16px 0; color: #64748B; font-size: 14px; line-height: 1.6;">
                        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                      </p>
                      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
                      <p style="margin: 0; color: #94A3B8; font-size: 13px;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 8px 0 0 0; color: #64748B; font-size: 12px; word-break: break-all;">
                        ${resetLink}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #F8FAFC; padding: 24px 32px; text-align: center;">
                      <p style="margin: 0; color: #94A3B8; font-size: 13px;">
                        &copy; ${new Date().getFullYear()} LISTD. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Resend API error:", JSON.stringify(emailError));
      await supabaseAdmin.from("email_logs").insert({
        function_name: "send-password-reset",
        recipient_email: email,
        subject: "Reset your LISTD password",
        status: "failed",
        resend_id: null,
        error_message: emailError.message || JSON.stringify(emailError),
        metadata: {},
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resendId = emailData?.id ?? null;
    console.log("Password reset email sent successfully. Resend ID:", resendId);

    await supabaseAdmin.from("email_logs").insert({
      function_name: "send-password-reset",
      recipient_email: email,
      subject: "Reset your LISTD password",
      status: resendId ? "sent" : "failed",
      resend_id: resendId,
      metadata: {},
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error.message, error.stack);
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
