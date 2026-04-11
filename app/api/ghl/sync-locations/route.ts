import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";
import { syncGHLLocations } from "@/lib/ghl/syncLocations";

// GET /api/ghl/sync-locations
// Re-fetches all sub-account locations from GHL and upserts them into ghl_locations.
//
// Called from the IntegrationsPage "Sync locations" button when the agency adds
// a new med spa to GHL and needs SourceIQ to pick it up without re-connecting.
//
// Why admin client for companyId lookup: getValidGHLToken also uses admin internally,
// and we need provider_user_id (companyId) which is on the same integrations row.
// Consistent to keep all integrations reads server-side with service-role here.
export async function GET() {
  // Validate user session — this is a user-initiated action, not a cron
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  // Look up the agency GHL integration to get companyId (stored as provider_user_id).
  // provider_user_id is set during OAuth callback — it holds the GHL companyId for
  // agency-level connects, or locationId for single-location connects.
  const admin = createAdminClient();
  const { data: integration, error } = await admin
    .from("integrations")
    .select("provider_user_id")
    .eq("org_id", orgId)
    .eq("provider", "ghl")
    .eq("status", "active")
    .single();

  if (error || !integration?.provider_user_id) {
    return NextResponse.json(
      { error: "GHL not connected or missing company ID" },
      { status: 404 }
    );
  }

  try {
    const token = await getValidGHLToken(orgId);
    await syncGHLLocations(orgId, integration.provider_user_id, token);

    // Return the total count of locations now in the table so the UI can update
    const { count } = await admin
      .from("ghl_locations")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    return NextResponse.json({ synced: count ?? 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
