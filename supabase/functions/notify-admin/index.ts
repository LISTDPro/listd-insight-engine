import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "hello@listd.co.uk";

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

interface AdminNotification {
  type: "signup" | "job_posted" | "ib_sync" | "waitlist_lead";
  // signup
  userName?: string;
  userEmail?: string;
  userRole?: string;
  // job_posted
  jobId?: string;
  propertyAddress?: string;
  city?: string;
  postcode?: string;
  inspectionType?: string;
  scheduledDate?: string;
  // ib_sync
  totalEvents?: number;
  matchedCount?: number;
  // waitlist_lead
  leadName?: string;
  leadEmail?: string;
  leadCompany?: string;
  leadPhone?: string;
  leadRole?: string;
  leadPortfolioSize?: string;
  leadMonthlyVolume?: string;
}

function buildEmail(payload: AdminNotification): { subject: string; html: string } {
  const year = new Date().getFullYear();

  const wrap = (title: string, body: string) => `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #18181b; font-size: 22px; margin: 0;">${escapeHtml(title)}</h1>
          </div>
          ${body}
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #a1a1aa; font-size: 12px;">&copy; ${year} LISTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`;

  switch (payload.type) {
    case "signup": {
      const name = escapeHtml(payload.userName || "Unknown");
      const email = escapeHtml(payload.userEmail || "—");
      const role = escapeHtml(payload.userRole || "—");
      return {
        subject: `🆕 New Sign-Up: ${payload.userName || "Unknown"} (${role})`,
        html: wrap("New User Sign-Up", `
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Name:</td><td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Email:</td><td style="padding: 8px 0; color: #18181b; font-size: 14px;">${email}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Role:</td><td style="padding: 8px 0; color: #18181b; font-size: 14px;">${role}</td></tr>
          </table>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://listd.co.uk/dashboard/admin" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View in Admin Panel</a>
          </div>
        `),
      };
    }

    case "job_posted": {
      const address = escapeHtml(payload.propertyAddress || "—");
      const city = escapeHtml(payload.city || "");
      const postcode = escapeHtml(payload.postcode || "");
      const type = escapeHtml(payload.inspectionType?.replace("_", " ") || "—");
      const date = payload.scheduledDate
        ? new Date(payload.scheduledDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : "—";
      return {
        subject: `📋 New Job Posted: ${payload.inspectionType?.replace("_", " ")} in ${payload.city || "Unknown"}`,
        html: wrap("New Job Posted", `
          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Type:</td><td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${type}</td></tr>
              <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Property:</td><td style="padding: 8px 0; color: #18181b; font-size: 14px;">${address}</td></tr>
              <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Location:</td><td style="padding: 8px 0; color: #18181b; font-size: 14px;">${city}, ${postcode}</td></tr>
              <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Date:</td><td style="padding: 8px 0; color: #18181b; font-size: 14px;">${escapeHtml(date)}</td></tr>
            </table>
          </div>
          <div style="text-align: center;">
            <a href="https://listd.co.uk/dashboard/admin" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View in Admin Panel</a>
          </div>
        `),
      };
    }

    case "ib_sync": {
      return {
        subject: `🔄 IB Sync Complete: ${payload.totalEvents || 0} events, ${payload.matchedCount || 0} matched`,
        html: wrap("InventoryBase Sync Complete", `
          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Total Events:</td><td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${payload.totalEvents || 0}</td></tr>
              <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Auto-Matched:</td><td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${payload.matchedCount || 0}</td></tr>
            </table>
          </div>
          <div style="text-align: center;">
            <a href="https://listd.co.uk/dashboard/admin" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Review Matches</a>
          </div>
        `),
      };
    }

    case "waitlist_lead": {
      const name = escapeHtml(payload.leadName || "Unknown");
      const email = escapeHtml(payload.leadEmail || "—");
      const company = escapeHtml(payload.leadCompany || "—");
      const phone = escapeHtml(payload.leadPhone || "—");
      const role = escapeHtml(payload.leadRole || "—");
      const portfolio = escapeHtml(payload.leadPortfolioSize || "Not specified");
      const volume = escapeHtml(payload.leadMonthlyVolume || "Not specified");
      const submittedAt = new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });
      return {
        subject: `🚀 New Early Access Request: ${payload.leadName || "Unknown"} – ${payload.leadCompany || ""}`,
        html: wrap("New Early Access Request", `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #15803d; font-size: 13px; font-weight: 600;">⚡ New waitlist lead submitted on ${escapeHtml(submittedAt)}</p>
          </div>
          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 7px 0; color: #71717a; font-size: 13px; width: 40%;">Name:</td><td style="padding: 7px 0; color: #18181b; font-size: 13px; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 7px 0; color: #71717a; font-size: 13px;">Company:</td><td style="padding: 7px 0; color: #18181b; font-size: 13px; font-weight: 600;">${company}</td></tr>
              <tr><td style="padding: 7px 0; color: #71717a; font-size: 13px;">Email:</td><td style="padding: 7px 0; color: #18181b; font-size: 13px;"><a href="mailto:${email}" style="color: #0d9488;">${email}</a></td></tr>
              <tr><td style="padding: 7px 0; color: #71717a; font-size: 13px;">Phone:</td><td style="padding: 7px 0; color: #18181b; font-size: 13px;">${phone}</td></tr>
              <tr><td style="padding: 7px 0; color: #71717a; font-size: 13px;">Role:</td><td style="padding: 7px 0; color: #18181b; font-size: 13px;">${role}</td></tr>
              <tr><td style="padding: 7px 0; color: #71717a; font-size: 13px;">Portfolio Size:</td><td style="padding: 7px 0; color: #18181b; font-size: 13px;">${portfolio}</td></tr>
              <tr><td style="padding: 7px 0; color: #71717a; font-size: 13px;">Monthly Volume:</td><td style="padding: 7px 0; color: #18181b; font-size: 13px;">${volume}</td></tr>
            </table>
          </div>
          <div style="text-align: center;">
            <a href="https://listd.co.uk/dashboard/admin" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Waitlist in Admin Panel</a>
          </div>
        `),
      };
    }

    default:
      return { subject: "LISTD Admin Notification", html: wrap("Notification", "<p>An event occurred.</p>") };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: AdminNotification = await req.json();
    const { subject, html } = buildEmail(payload);

    console.log(`Sending admin notification: ${payload.type} — ${subject}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "LISTD <notifications@listd.co.uk>",
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Admin notification sent:", emailResult);

    return new Response(
      JSON.stringify({ success: emailResponse.ok, id: emailResult?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-admin:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
