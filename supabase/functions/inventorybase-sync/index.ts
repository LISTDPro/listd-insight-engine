import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple iCal parser
function parseICalEvents(icalText: string) {
  const events: Array<{
    uid: string;
    summary: string;
    description: string;
    dtstart: string;
    dtend: string;
    location: string;
  }> = [];

  const eventBlocks = icalText.split("BEGIN:VEVENT");

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split("END:VEVENT")[0];

    const getField = (name: string): string => {
      const unfoldedBlock = block.replace(/\r?\n[ \t]/g, "");
      const regex = new RegExp(`^${name}[;:](.*)$`, "m");
      const match = unfoldedBlock.match(regex);
      if (!match) return "";
      if (name === "DTSTART" || name === "DTEND") {
        const parts = match[0].split(":");
        return parts[parts.length - 1].trim();
      }
      return match[1].trim();
    };

    const event = {
      uid: getField("UID"),
      summary: getField("SUMMARY"),
      description: getField("DESCRIPTION") || "",
      dtstart: getField("DTSTART"),
      dtend: getField("DTEND"),
      location: getField("LOCATION") || "",
    };

    if (event.uid && event.summary) {
      events.push(event);
    }
  }

  return events;
}

// Convert iCal date to ISO string
function icalDateToISO(icalDate: string): string {
  if (!icalDate) return "";
  const clean = icalDate.replace(/[^0-9TZ]/g, "");
  if (clean.length >= 8) {
    const year = clean.slice(0, 4);
    const month = clean.slice(4, 6);
    const day = clean.slice(6, 8);
    if (clean.length >= 15) {
      const hour = clean.slice(9, 11);
      const min = clean.slice(11, 13);
      const sec = clean.slice(13, 15);
      return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
    }
    return `${year}-${month}-${day}`;
  }
  return icalDate;
}

// Extract just the date portion (YYYY-MM-DD) from an ISO string or iCal date
function extractDate(isoOrIcal: string): string {
  if (!isoOrIcal) return "";
  return isoOrIcal.slice(0, 10);
}

// Normalize an address string for fuzzy comparison
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[,.\-\/\\#]+/g, " ")
    .replace(/\b(flat|apartment|apt|unit|suite|floor|room)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Calculate simple word-overlap similarity (0..1)
function addressSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeAddress(a).split(" ").filter(w => w.length > 1));
  const wordsB = new Set(normalizeAddress(b).split(" ").filter(w => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  const maxLen = Math.max(wordsA.size, wordsB.size);
  return overlap / maxLen;
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this is an auto-link request
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action;

    if (action === "auto-link") {
      // Link a specific IB event UID to a LISTD job ID
      const { job_id, inventorybase_uid } = body;
      if (!job_id || !inventorybase_uid) {
        return new Response(JSON.stringify({ error: "Missing job_id or inventorybase_uid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabaseAdmin
        .from("jobs")
        .update({ inventorybase_job_id: inventorybase_uid })
        .eq("id", job_id);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Job linked to InventoryBase event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the iCal feed
    const calendarKey = Deno.env.get("INVENTORYBASE_CALENDAR_KEY");
    if (!calendarKey) {
      return new Response(
        JSON.stringify({ error: "INVENTORYBASE_CALENDAR_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Support both full URL and raw key formats
    const calendarUrl = calendarKey.startsWith("http")
      ? calendarKey
      : `https://my.inventorybase.com/generate/calendar?key=${calendarKey}`;
    console.log("Fetching InventoryBase calendar feed...");

    const calResponse = await fetch(calendarUrl);
    if (!calResponse.ok) {
      const errorBody = await calResponse.text();
      console.error(`Calendar fetch failed: status=${calResponse.status}, body=${errorBody}, url=${calendarUrl}`);
      return new Response(
        JSON.stringify({ error: `Calendar fetch failed: ${calResponse.status}`, details: errorBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const icalText = await calResponse.text();
    const events = parseICalEvents(icalText);
    console.log(`Parsed ${events.length} events from InventoryBase calendar`);

    // Fetch all unlinked jobs with their properties for matching
    const { data: unmatchedJobs } = await supabaseAdmin
      .from("jobs")
      .select("id, scheduled_date, inventorybase_job_id, status, inspection_type, property_id")
      .is("inventorybase_job_id", null)
      .not("status", "in", '("cancelled","paid")');

    const propertyIds = [...new Set((unmatchedJobs || []).map(j => j.property_id))];
    
    let propertiesMap: Record<string, { address_line_1: string; address_line_2: string | null; city: string; postcode: string }> = {};
    
    if (propertyIds.length > 0) {
      const { data: properties } = await supabaseAdmin
        .from("properties")
        .select("id, address_line_1, address_line_2, city, postcode")
        .in("id", propertyIds);
      
      if (properties) {
        for (const p of properties) {
          propertiesMap[p.id] = p;
        }
      }
    }

    // Build matches
    const parsedEvents = events.map((e) => {
      const startISO = icalDateToISO(e.dtstart);
      const eventDate = extractDate(startISO);
      const eventLocation = e.location || e.summary || "";

      let bestMatch: { job_id: string; score: number; property_address: string } | null = null;

      for (const job of (unmatchedJobs || [])) {
        const jobDate = job.scheduled_date; // already YYYY-MM-DD
        const property = propertiesMap[job.property_id];
        if (!property) continue;

        // Date must match
        if (eventDate !== jobDate) continue;

        // Compare address
        const fullAddress = [property.address_line_1, property.address_line_2, property.city, property.postcode]
          .filter(Boolean)
          .join(" ");

        const score = addressSimilarity(eventLocation, fullAddress);

        if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = {
            job_id: job.id,
            score: Math.round(score * 100),
            property_address: fullAddress,
          };
        }
      }

      return {
        uid: e.uid,
        summary: e.summary,
        description: e.description,
        start_date: startISO,
        end_date: icalDateToISO(e.dtend),
        location: e.location,
        match: bestMatch,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        total_events: parsedEvents.length,
        events: parsedEvents,
        matched_count: parsedEvents.filter(e => e.match).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("InventoryBase sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
