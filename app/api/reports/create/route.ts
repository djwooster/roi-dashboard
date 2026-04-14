import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

// POST /api/reports/create
// Creates (or retrieves an existing) shareable report URL for a specific location.
//
// Design intent: one persistent report per (org, location). Agencies generate a
// link per med spa client once, share it, and it stays current forever — the
// report page fetches live data on every view.
//
// locationId from the request body is preferred. Falls back to
// integrations.provider_user_id for single-location orgs that haven't migrated
// to the ghl_locations flow yet.

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const body = await request.json().catch(() => ({})) as { locationId?: string };
  const admin = createAdminClient();

  // Resolve locationId: use what the client sent (active location in switcher),
  // or fall back to the single-location integrations row for legacy accounts.
  let locationId = body.locationId ?? null;
  if (!locationId) {
    const { data: integration } = await admin
      .from("integrations")
      .select("provider_user_id")
      .eq("org_id", orgId)
      .eq("provider", "ghl")
      .eq("status", "active")
      .single();
    locationId = integration?.provider_user_id ?? null;
  }

  if (!locationId) {
    return NextResponse.json({ error: "GHL not connected" }, { status: 404 });
  }

  // Return the existing report for this org+location rather than creating a duplicate.
  // Each (org_id, location_id) pair has at most one report row — enforced by DB constraint.
  const { data: existing } = await admin
    .from("reports")
    .select("token")
    .eq("org_id", orgId)
    .eq("location_id", locationId)
    .single();

  if (existing) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/report/${existing.token}`;
    return NextResponse.json({ url });
  }

  // Resolve location name — prefer ghl_locations (already fetched at connect time),
  // fall back to a live GHL API call for single-location accounts.
  let locationName = "";
  const { data: locRow } = await admin
    .from("ghl_locations")
    .select("location_name")
    .eq("org_id", orgId)
    .eq("location_id", locationId)
    .single();

  if (locRow?.location_name) {
    locationName = locRow.location_name;
  } else {
    try {
      const token = await getValidGHLToken(orgId);
      const res = await fetch(`${GHL_API}/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION },
      });
      if (res.ok) {
        const data = await res.json() as { location?: { name?: string } };
        locationName = data.location?.name ?? "";
      }
    } catch {
      // Non-fatal — report still works without the location name
    }
  }

  // Get the org name for the agency header on the report
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const { data: report, error } = await admin
    .from("reports")
    .insert({
      org_id: orgId,
      agency_name: org?.name ?? "",
      location_id: locationId,
      location_name: locationName,
    })
    .select("token")
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/report/${report.token}`;
  return NextResponse.json({ url });
}
