import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";
import { fetchLocationData, type GHLDateRange } from "@/lib/ghl/fetchLocationData";

// Re-export types from the canonical types file so existing component imports
// (e.g. `from "@/app/api/ghl/sync/route"`) continue to work without changes.
export type { GHLPipelineStage, GHLPipelineData, GHLSyncResponse } from "@/lib/ghl/types";

// How stale a metrics cache entry can be before we fall back to a live GHL call.
// The cron runs hourly, so 2 hours gives one missed run worth of headroom.
const CACHE_STALE_MS = 2 * 60 * 60 * 1000;

// Period labels the cron pre-syncs — used to gate cache lookups.
// Defined at module scope so it's not reallocated on every request.
const KNOWN_PERIODS = new Set(["all_time", "today", "7d", "30d", "90d"]);

// GET /api/ghl/sync?locationId={id}&period={label}&from={iso}&to={iso}
// Returns KPI and pipeline data for the requested GHL location.
// Called by the dashboard on mount (and on client switch / date range change).
//
// Cache behaviour:
//   1. If ?period= is one of the known cron-synced labels (all_time / today / 7d /
//      30d / 90d), look up a fresh metrics row first. If found and < 2h old, return
//      it immediately — no GHL API call needed.
//   2. Otherwise (cache miss, stale, or custom date range), fall through to a live
//      GHL call using ?from= and ?to= as before.
//
// Location resolution order:
//   1. ?locationId query param — used by the client switcher
//   2. First row in ghl_locations — agency mode default (no switcher selection yet)
//   3. integrations.provider_user_id — single-location / backward-compatible fallback
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { data: integration } = await supabase
    .from("integrations")
    .select("provider_user_id")
    .eq("org_id", orgId)
    .eq("provider", "ghl")
    .eq("status", "active")
    .single();

  if (!integration) return NextResponse.json({ error: "GHL not connected" }, { status: 404 });

  // Resolve which location to fetch data for.
  // ?locationId wins so the client switcher can request any sub-account.
  // If not provided, check ghl_locations for agency mode.
  // Fall back to provider_user_id for single-location connections.
  let locationId = request.nextUrl.searchParams.get("locationId");

  if (!locationId) {
    const { data: locations } = await supabase
      .from("ghl_locations")
      .select("location_id")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true })
      .limit(1);

    locationId = locations?.[0]?.location_id ?? integration.provider_user_id;
  }

  if (!locationId) return NextResponse.json({ error: "No GHL location ID found" }, { status: 400 });

  // ── Cache lookup ────────────────────────────────────────────────────────────
  // If the dashboard passes a ?period= label (e.g. "30d"), check for a fresh
  // metrics row before hitting the GHL API. This prevents unnecessary GHL calls
  // and guards against rate limits as the customer base grows.
  const period = request.nextUrl.searchParams.get("period");

  if (period && KNOWN_PERIODS.has(period)) {
    const { data: cached } = await supabase
      .from("metrics")
      .select("data, synced_at")
      .eq("org_id", orgId)
      .eq("location_id", locationId)
      .eq("provider", "ghl")
      .eq("period_label", period)
      .single();

    if (cached) {
      const ageMs = Date.now() - new Date(cached.synced_at).getTime();
      if (ageMs < CACHE_STALE_MS) {
        // Fresh cache hit — return without touching GHL
        return NextResponse.json(cached.data);
      }
    }
    // Cache miss or stale — fall through to live call below
  }

  // Get a valid token — refreshes automatically if expired or expiring soon.
  // The company-level token (agency mode) is valid for all locations under that company.
  // Throws and marks integration inactive if the refresh token is also invalid.
  let token: string;
  try {
    token = await getValidGHLToken(orgId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "GHL token unavailable";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  // Optional date range — forwarded from the dashboard's date picker.
  // GHL applies these as startDate/endDate filters on opportunity createdAt.
  const from = request.nextUrl.searchParams.get("from") ?? undefined;
  const to = request.nextUrl.searchParams.get("to") ?? undefined;
  const dateRange: GHLDateRange | undefined = from || to ? { from, to } : undefined;

  try {
    const data = await fetchLocationData(locationId, token, dateRange);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "GHL sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
