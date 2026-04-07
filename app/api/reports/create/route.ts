import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

// POST /api/reports/create
// Creates (or retrieves an existing) shareable report URL for the org's GHL location.
//
// Design intent: one persistent report per org. Agencies share the URL once and
// it stays current forever — the report page fetches live GHL data on every view.
// Calling this endpoint again returns the same URL so the agency doesn't end up
// with multiple links floating around.

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const admin = createAdminClient();

  // Check if a report already exists for this org — return it rather than creating a duplicate.
  const { data: existing } = await admin
    .from("reports")
    .select("token")
    .eq("org_id", orgId)
    .single();

  if (existing) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/report/${existing.token}`;
    return NextResponse.json({ url });
  }

  // Look up the GHL integration to get the location ID
  const { data: integration } = await admin
    .from("integrations")
    .select("provider_user_id")
    .eq("org_id", orgId)
    .eq("provider", "ghl")
    .eq("status", "active")
    .single();

  if (!integration?.provider_user_id) {
    return NextResponse.json({ error: "GHL not connected" }, { status: 404 });
  }

  const locationId = integration.provider_user_id;

  // Fetch the GHL location name to display on the report.
  // Falls back to empty string gracefully if the API call fails.
  let locationName = "";
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
