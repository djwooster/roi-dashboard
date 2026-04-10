import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";
import { getValidLocationToken } from "@/lib/ghl/getValidLocationToken";
import { fetchLocationData, type GHLDateRange } from "@/lib/ghl/fetchLocationData";

// Re-export types from the canonical types file so existing component imports
// (e.g. `from "@/app/api/ghl/sync/route"`) continue to work without changes.
export type { GHLPipelineStage, GHLPipelineData, GHLSyncResponse } from "@/lib/ghl/types";

// How stale a metrics cache entry can be before we fall back to a live GHL call.
// Cron runs daily on Hobby plan, so 25h gives one missed run worth of headroom.
// Raise back to 2h when upgraded to Vercel Pro (hourly cron).
const CACHE_STALE_MS = 25 * 60 * 60 * 1000;

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

  // Try to get a location-specific token from ghl_locations (stored by per-location
  // sub-account OAuth). This token has contacts.readonly + opportunities.readonly
  // which are required for data fetches. Falls back to the company token if the
  // location hasn't been connected yet — data will be empty until it is.
  let token: string;
  const locationToken = await getValidLocationToken(orgId, locationId);

  if (locationToken) {
    token = locationToken;
  } else {
    // No location token — fall back to company token (agency connect only).
    // contacts/opportunities endpoints will return empty until the location is
    // connected via sub-account OAuth from the integrations page.
    try {
      token = await getValidGHLToken(orgId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "GHL token unavailable";
      return NextResponse.json({ error: message }, { status: 401 });
    }
  }

  // Optional date range — forwarded from the dashboard's date picker.
  // GHL applies these as startDate/endDate filters on opportunity createdAt.
  const from = request.nextUrl.searchParams.get("from") ?? undefined;
  const to = request.nextUrl.searchParams.get("to") ?? undefined;
  const dateRange: GHLDateRange | undefined = from || to ? { from, to } : undefined;

  try {
    const data = await fetchLocationData(locationId, token, dateRange);

    // Inject showed count from appointment_confirmations — this is our data, not GHL's.
    // The table may not exist in older deployments; Supabase returns an error (not a throw)
    // so we default to 0 safely. The user-scoped client is used here because the sync
    // route runs in an authenticated context and RLS is correct.
    const { count: showedCount } = await supabase
      .from("appointment_confirmations")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("location_id", locationId)
      .eq("outcome", "showed");

    return NextResponse.json({ ...data, showedCount: showedCount ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "GHL sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
