import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

async function getValidAccessToken(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string
) {
  const { data: connection, error } = await supabaseAdmin
    .from("xero_connections")
    .select("*")
    .eq("user_id", userId)
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !connection) {
    throw new Error("No Xero connection found. Please connect your Xero account first.");
  }

  const expiresAt = new Date(connection.token_expires_at).getTime();
  if (Date.now() < expiresAt - 60_000) {
    return { accessToken: connection.access_token, tenantId: connection.tenant_id };
  }

  const XERO_CLIENT_ID = Deno.env.get("XERO_CLIENT_ID");
  const XERO_CLIENT_SECRET = Deno.env.get("XERO_CLIENT_SECRET");
  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    throw new Error("Xero credentials not configured on server");
  }

  const refreshResponse = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    }),
  });

  if (!refreshResponse.ok) {
    console.error("Token refresh failed:", await refreshResponse.text());
    throw new Error("Failed to refresh Xero token. Please reconnect your Xero account.");
  }

  const tokens = await refreshResponse.json();
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabaseAdmin
    .from("xero_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpiresAt,
    })
    .eq("id", connection.id);

  return { accessToken: tokens.access_token, tenantId: connection.tenant_id };
}

serve(async (req) => {
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

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { job_id, amount } = await req.json();
    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the invoice reference for this job
    const jobRef = `LISTD-${job_id.substring(0, 8).toUpperCase()}`;

    const { accessToken, tenantId } = await getValidAccessToken(supabaseAdmin, userId);

    // Find the invoice by reference in Xero
    const searchResponse = await fetch(
      `${XERO_API_BASE}/Invoices?where=Reference=="${jobRef}"&Statuses=AUTHORISED`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "xero-tenant-id": tenantId,
          Accept: "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error("Xero invoice search failed:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to find Xero invoice", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchResponse.json();
    const invoice = searchData.Invoices?.[0];

    if (!invoice) {
      return new Response(
        JSON.stringify({
          error: "No matching Xero invoice found",
          reference: jobRef,
          hint: "Create the invoice first before recording a payment.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record payment against the invoice
    const paymentAmount = amount || invoice.AmountDue || invoice.Total;

    const paymentPayload = {
      Invoice: { InvoiceID: invoice.InvoiceID },
      Account: { Code: "090" }, // Default bank account code
      Date: new Date().toISOString().split("T")[0],
      Amount: paymentAmount,
      Reference: `LISTD-PAY-${job_id.substring(0, 8).toUpperCase()}`,
    };

    const paymentResponse = await fetch(`${XERO_API_BASE}/Payments`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "xero-tenant-id": tenantId,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error("Xero payment error:", JSON.stringify(paymentData));
      return new Response(
        JSON.stringify({ error: "Failed to record Xero payment", details: paymentData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdPayment = paymentData.Payments?.[0];

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: createdPayment?.PaymentID,
        invoice_id: invoice.InvoiceID,
        invoice_number: invoice.InvoiceNumber,
        amount: paymentAmount,
        reference: paymentPayload.Reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Xero record payment error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
