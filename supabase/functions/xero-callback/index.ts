import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // user_id
    const error = url.searchParams.get("error");

    const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://listdcouk.lovable.app";

    if (error) {
      console.error("Xero OAuth error:", error);
      return Response.redirect(
        `${FRONTEND_URL}/xero/callback?error=${encodeURIComponent(error)}`,
        302
      );
    }

    if (!code || !state) {
      return Response.redirect(
        `${FRONTEND_URL}/xero/callback?error=missing_params`,
        302
      );
    }

    const XERO_CLIENT_ID = Deno.env.get("XERO_CLIENT_ID");
    const XERO_CLIENT_SECRET = Deno.env.get("XERO_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
      console.error("Xero credentials not configured");
      return Response.redirect(
        `${FRONTEND_URL}/xero/callback?error=server_config`,
        302
      );
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/xero-callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error("Token exchange failed:", errBody);
      return Response.redirect(
        `${FRONTEND_URL}/xero/callback?error=token_exchange`,
        302
      );
    }

    const tokens = await tokenResponse.json();

    // Get connected Xero tenants
    const tenantsResponse = await fetch("https://api.xero.com/connections", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!tenantsResponse.ok) {
      console.error("Failed to fetch Xero tenants");
      return Response.redirect(
        `${FRONTEND_URL}/xero/callback?error=tenants_fetch`,
        302
      );
    }

    const tenants = await tenantsResponse.json();

    if (!tenants || tenants.length === 0) {
      return Response.redirect(
        `${FRONTEND_URL}/xero/callback?error=no_tenants`,
        302
      );
    }

    // Store connection using service role (bypasses RLS for upsert)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store connection for each tenant (usually just one for small businesses)
    for (const tenant of tenants) {
      const { error: upsertError } = await supabase
        .from("xero_connections")
        .upsert(
          {
            user_id: state,
            tenant_id: tenant.tenantId,
            tenant_name: tenant.tenantName || tenant.tenantId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: expiresAt,
            scopes: tokens.scope || "",
          },
          { onConflict: "user_id,tenant_id" }
        );

      if (upsertError) {
        console.error("Failed to store Xero connection:", upsertError);
        return Response.redirect(
          `${FRONTEND_URL}/xero/callback?error=storage_failed`,
          302
        );
      }
    }

    const tenantName = tenants[0].tenantName || "Xero";

    return Response.redirect(
      `${FRONTEND_URL}/xero/callback?success=true&tenant=${encodeURIComponent(tenantName)}`,
      302
    );
  } catch (error) {
    console.error("Xero callback error:", error);
    const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://listdcouk.lovable.app";
    return Response.redirect(
      `${FRONTEND_URL}/xero/callback?error=unknown`,
      302
    );
  }
});
