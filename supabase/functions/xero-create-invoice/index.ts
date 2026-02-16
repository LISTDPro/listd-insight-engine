import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

/**
 * Refresh Xero access token if expired.
 * Returns the current (or refreshed) access token.
 */
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

  // Check if token is expired (with 60s buffer)
  const expiresAt = new Date(connection.token_expires_at).getTime();
  const now = Date.now();

  if (now < expiresAt - 60_000) {
    return { accessToken: connection.access_token, tenantId: connection.tenant_id };
  }

  // Refresh the token
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
    const errText = await refreshResponse.text();
    console.error("Token refresh failed:", errText);
    throw new Error("Failed to refresh Xero token. Please reconnect your Xero account.");
  }

  const tokens = await refreshResponse.json();
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Update stored tokens
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
    // Authenticate user
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

    // Parse request body
    const { job_id } = await req.json();
    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to fetch job details (cross-table access)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select(`
        *,
        property:properties(
          address_line_1,
          address_line_2,
          city,
          postcode,
          property_type,
          bedrooms,
          bathrooms
        )
      `)
      .eq("id", job_id)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user owns this job
    if (job.client_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized for this job" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get valid Xero access token
    const { accessToken, tenantId } = await getValidAccessToken(supabaseAdmin, userId);

    // Build the Xero invoice
    const inspectionTypeLabels: Record<string, string> = {
      new_inventory: "New Inventory",
      check_in: "Check-In",
      check_out: "Check-Out",
      mid_term: "Mid-Term Inspection",
      interim: "Interim Inspection",
    };

    const price = job.final_price || job.quoted_price || 0;
    const address = job.property
      ? `${job.property.address_line_1}, ${job.property.city}, ${job.property.postcode}`
      : "Property inspection";
    const inspectionLabel = inspectionTypeLabels[job.inspection_type] || job.inspection_type;

    const invoicePayload = {
      Type: "ACCREC", // Accounts Receivable invoice
      Contact: {
        Name: address, // Use property address as contact name for now
      },
      Date: new Date().toISOString().split("T")[0],
      DueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      LineAmountTypes: "Inclusive",
      LineItems: [
        {
          Description: `${inspectionLabel} — ${address}`,
          Quantity: 1,
          UnitAmount: price,
          AccountCode: "200", // Default Sales account code
        },
      ],
      Reference: `LISTD-${job.id.substring(0, 8).toUpperCase()}`,
      Status: "AUTHORISED",
    };

    // Create invoice in Xero
    const xeroResponse = await fetch(`${XERO_API_BASE}/Invoices`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "xero-tenant-id": tenantId,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ Invoices: [invoicePayload] }),
    });

    const xeroData = await xeroResponse.json();

    if (!xeroResponse.ok) {
      console.error("Xero API error:", JSON.stringify(xeroData));
      return new Response(
        JSON.stringify({
          error: "Failed to create Xero invoice",
          details: xeroData,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const createdInvoice = xeroData.Invoices?.[0];

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: createdInvoice?.InvoiceID,
        invoice_number: createdInvoice?.InvoiceNumber,
        reference: invoicePayload.Reference,
        amount: price,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Xero create invoice error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
