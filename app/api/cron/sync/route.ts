import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";
import { fetchLocationData, type GHLDateRange } from "@/lib/ghl/fetchLocationData";

// Returns "YYYY-MM-DD" for a date N days ago (0 = today).
// Called at sync time so each cron run computes fresh window boundaries.
function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// The five period windows that the dashboard date picker can display.
// The cron syncs all five for each location so every picker selection has a
// fresh cache entry waiting — no live fallback needed during normal operation.
type PeriodSpec = { label: string; range: GHLDateRange | undefined };
function buildPeriods(): PeriodSpec[] {
  const today = isoDate(0);
  return [
    { label: "all_time", range: undefined },
    { label: "today",    range: { from: today,      to: today } },
    { label: "7d",       range: { from: isoDate(6), to: today } },
    { label: "30d",      range: { from: isoDate(29),to: today } },
    { label: "90d",      range: { from: isoDate(89),to: today } },
  ];
}

// GET /api/cron/sync
// Called by Vercel Cron on the schedule defined in vercel.json (hourly).
// Loops every active GHL integration, fetches KPI data for each location + period,
// and upserts the results into the metrics table.
//
// Protected by CRON_SECRET — Vercel injects this automatically via the
// Authorization header. Without it the route returns 401.
export async function GET(request: NextRequest) {
  // Guard: only Vercel Cron (or our own tooling in dev) may call this endpoint.
  // Vercel sets: Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const periods = buildPeriods();

  // Fetch all active GHL integrations across all orgs.
  // We use the admin client (service role) because this route runs outside any
  // user session — RLS would block the query entirely.
  const { data: integrations, error: intError } = await admin
    .from("integrations")
    .select("org_id, provider_user_id")
    .eq("provider", "ghl")
    .eq("status", "active");

  if (intError) {
    console.error("[cron/sync] Failed to fetch integrations:", intError.message);
    return NextResponse.json({ error: intError.message }, { status: 500 });
  }

  if (!integrations || integrations.length === 0) {
    return NextResponse.json({ synced: 0, message: "No active GHL integrations" });
  }

  // Fetch all locations for all orgs in one query, then group by org_id.
  // Avoids the N+1 pattern of querying ghl_locations once per integration.
  const orgIds = integrations.map((i) => i.org_id);
  const { data: allLocs } = await admin
    .from("ghl_locations")
    .select("org_id, location_id")
    .in("org_id", orgIds);

  const locsByOrg = (allLocs ?? []).reduce<Record<string, string[]>>((acc, l) => {
    (acc[l.org_id] ??= []).push(l.location_id);
    return acc;
  }, {});

  let totalSynced = 0;
  const errors: string[] = [];

  for (const integration of integrations) {
    const { org_id, provider_user_id } = integration;

    // Agency accounts have rows in ghl_locations; single-location accounts fall
    // back to provider_user_id (the GHL location ID stored at OAuth time).
    const locationIds: string[] =
      locsByOrg[org_id]?.length > 0
        ? locsByOrg[org_id]
        : provider_user_id
        ? [provider_user_id]
        : [];

    if (locationIds.length === 0) {
      errors.push(`org ${org_id}: no location IDs found`);
      continue;
    }

    // Get (and if needed refresh) the GHL token for this org once, then reuse
    // it across all locations and periods — token is company-scoped for agencies.
    let token: string;
    try {
      token = await getValidGHLToken(org_id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`org ${org_id}: token error — ${msg}`);
      continue;
    }

    for (const locationId of locationIds) {
      for (const period of periods) {
        try {
          const data = await fetchLocationData(locationId, token, period.range);

          // Upsert: on conflict (same org+location+provider+period), overwrite
          // data and bump synced_at to now. This is the write path — the sync
          // route is the read path.
          const { error: upsertError } = await admin
            .from("metrics")
            .upsert(
              {
                org_id,
                location_id: locationId,
                provider: "ghl",
                period_label: period.label,
                synced_at: new Date().toISOString(),
                data,
              },
              { onConflict: "org_id,location_id,provider,period_label" }
            );

          if (upsertError) {
            errors.push(
              `org ${org_id} / loc ${locationId} / ${period.label}: ${upsertError.message}`
            );
          } else {
            totalSynced++;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`org ${org_id} / loc ${locationId} / ${period.label}: ${msg}`);
        }
      }
    }
  }

  return NextResponse.json({
    synced: totalSynced,
    errors: errors.length > 0 ? errors : undefined,
  });
}
