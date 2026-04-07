import { createAdminClient } from "@/lib/supabase/admin";
import { ghlFetch } from "./api";

type GHLLocation = {
  id: string;
  name: string;
  companyId: string;
};

type GHLLocationsResponse = {
  locations?: GHLLocation[];
};

// Fetches all sub-account locations for the given GHL company and upserts them
// into the ghl_locations table.
//
// Called after agency OAuth completes — at that point we have a company-level
// token and companyId, which lets us list every location the agency manages.
//
// Why admin client: called from an OAuth callback route that has no user session
// (the callback is a redirect from GHL, not an authenticated request). RLS would
// block the write, so we use service-role to bypass it.
//
// Errors are thrown so the caller (oauth-callback.ts) can decide how to handle
// them — a location sync failure shouldn't necessarily abort the connect flow,
// but we want visibility into what went wrong.
export async function syncGHLLocations(
  orgId: string,
  companyId: string,
  accessToken: string
): Promise<void> {
  const res = await ghlFetch(`/locations/?companyId=${companyId}`, accessToken);

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`GHL location list failed (${res.status}): ${body}`);
  }

  const data = await res.json() as GHLLocationsResponse;
  const locations = data.locations ?? [];

  if (locations.length === 0) return;

  const admin = createAdminClient();

  // Upsert all locations in a single call.
  // onConflict org_id,location_id — re-running sync after reconnect updates the name.
  await admin.from("ghl_locations").upsert(
    locations.map((loc) => ({
      org_id: orgId,
      location_id: loc.id,
      location_name: loc.name,
      company_id: companyId,
    })),
    { onConflict: "org_id,location_id" }
  );
}
