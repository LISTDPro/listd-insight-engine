import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TeamInviteRequest {
  email: string;
  organisationName: string;
  inviteToken: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, organisationName, inviteToken, inviterName }: TeamInviteRequest = await req.json();

    if (!email || !organisationName) {
      throw new Error("Missing required fields");
    }

    const signupUrl = `${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "https://listd-insight-engine.lovable.app"}/auth?invite=team&token=${inviteToken}`;

    const emailResponse = await resend.emails.send({
      from: "LISTD <hello@listd.co.uk>",
      to: [email],
      subject: `You've been invited to join ${organisationName} on LISTD`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">You're Invited!</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            ${inviterName} has invited you to join <strong>${organisationName}</strong> on LISTD.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            As a team member, you'll be able to create and manage inventory inspection bookings for your organisation.
          </p>
          <div style="margin: 32px 0;">
            <a href="${signupUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    // Log the email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        function_name: "send-team-invite",
        recipient_email: email,
        subject: `Team invitation to ${organisationName}`,
        status: "sent",
        resend_id: emailResponse?.data?.id || null,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-team-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
