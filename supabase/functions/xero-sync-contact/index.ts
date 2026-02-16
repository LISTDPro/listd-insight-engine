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
    // Authenticate
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

    // Parse body — either sync a single user or bulk sync
    const body = await req.json();
    const { user_ids } = body as { user_ids?: string[] };

    if (!user_ids || user_ids.length === 0) {
      return new Response(JSON.stringify({ error: "user_ids array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch profiles for the requested users
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, phone, company_name")
      .in("user_id", user_ids);

    if (profilesError || !profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: "No profiles found for given user_ids" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch emails from auth via admin
    const emailMap: Record<string, string> = {};
    for (const profile of profiles) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
      if (authUser?.user?.email) {
        emailMap[profile.user_id] = authUser.user.email;
      }
    }

    // Fetch roles
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", user_ids);

    const roleMap: Record<string, string> = {};
    if (roles) {
      for (const r of roles) {
        roleMap[r.user_id] = r.role;
      }
    }

    // Get Xero access token
    const { accessToken, tenantId } = await getValidAccessToken(supabaseAdmin, userId);

    const results: Array<{
      user_id: string;
      name: string;
      xero_contact_id?: string;
      action: "created" | "updated" | "skipped";
      error?: string;
    }> = [];

    for (const profile of profiles) {
      const email = emailMap[profile.user_id];
      const role = roleMap[profile.user_id] || "unknown";
      const contactName = profile.company_name || profile.full_name || email || profile.user_id;

      try {
        // Search for existing contact by email
        let existingContactId: string | null = null;

        if (email) {
          const searchRes = await fetch(
            `${XERO_API_BASE}/Contacts?where=EmailAddress=="${email}"`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "xero-tenant-id": tenantId,
                Accept: "application/json",
              },
            }
          );

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.Contacts?.length > 0) {
              existingContactId = searchData.Contacts[0].ContactID;
            }
          }
        }

        // Build contact payload
        const contactPayload: Record<string, unknown> = {
          Name: contactName,
          FirstName: profile.full_name?.split(" ")[0] || "",
          LastName: profile.full_name?.split(" ").slice(1).join(" ") || "",
          EmailAddress: email || "",
          ContactStatus: "ACTIVE",
        };

        if (profile.phone) {
          contactPayload.Phones = [
            { PhoneType: "MOBILE", PhoneNumber: profile.phone },
          ];
        }

        // Tag with LISTD role
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        contactPayload.ContactGroups = [];

        if (existingContactId) {
          // Update existing contact
          contactPayload.ContactID = existingContactId;

          const updateRes = await fetch(`${XERO_API_BASE}/Contacts/${existingContactId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "xero-tenant-id": tenantId,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ Contacts: [contactPayload] }),
          });

          if (updateRes.ok) {
            results.push({
              user_id: profile.user_id,
              name: contactName,
              xero_contact_id: existingContactId,
              action: "updated",
            });
          } else {
            const errData = await updateRes.text();
            results.push({
              user_id: profile.user_id,
              name: contactName,
              action: "skipped",
              error: errData,
            });
          }
        } else {
          // Create new contact
          const createRes = await fetch(`${XERO_API_BASE}/Contacts`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "xero-tenant-id": tenantId,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ Contacts: [contactPayload] }),
          });

          const createData = await createRes.json();

          if (createRes.ok) {
            const newContact = createData.Contacts?.[0];
            results.push({
              user_id: profile.user_id,
              name: contactName,
              xero_contact_id: newContact?.ContactID,
              action: "created",
            });
          } else {
            results.push({
              user_id: profile.user_id,
              name: contactName,
              action: "skipped",
              error: JSON.stringify(createData),
            });
          }
        }
      } catch (err) {
        results.push({
          user_id: profile.user_id,
          name: contactName,
          action: "skipped",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const created = results.filter((r) => r.action === "created").length;
    const updated = results.filter((r) => r.action === "updated").length;
    const skipped = results.filter((r) => r.action === "skipped").length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: { created, updated, skipped, total: results.length },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Xero sync contact error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
