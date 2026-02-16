import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const XERO_CLIENT_ID = Deno.env.get("XERO_CLIENT_ID");
    if (!XERO_CLIENT_ID) {
      return new Response(
        JSON.stringify({ error: "XERO_CLIENT_ID is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // redirect_uri from request body is no longer used for the OAuth flow.
    // The callback URL is server-determined for security.

    const XERO_SCOPES = [
      "openid",
      "profile",
      "email",
      "accounting.transactions",
      "accounting.contacts",
      "accounting.reports.read",
      "accounting.settings",
      "offline_access",
    ].join(" ");

    const state = claimsData.claims.sub;

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/xero-callback`;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: XERO_CLIENT_ID,
      redirect_uri: callbackUrl,
      scope: XERO_SCOPES,
      state: state,
    });

    const authorizeUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;

    return new Response(
      JSON.stringify({ url: authorizeUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Xero authorize error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
