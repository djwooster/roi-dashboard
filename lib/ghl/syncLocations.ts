import { createAdminClient } from "@/lib/supabase/admin";
import { ghlFetch } from "./api";

type GHLLocation = {
  id: string;
  name: string;
  companyId: string;
};

type GHLLocationsResponse = {
  locations?: GHLLocation[];
  count?: number;
};

// How many locations to fetch per page. GHL's default limit is 10 — we use 100
// to minimise round trips for agencies with large sub-account counts.
const PAGE_LIMIT = 100;

// Fetches all sub-account locations for the given GHL company and upserts them
// into the ghl_locations table.
//
// Called after agency OAuth completes — at that point we have a company-level
// token and companyId, which lets us list every location the agency manages.
//
// Paginates automatically — GHL caps results per page, so we loop with skip
// until we've fetched everything. Agencies with 40+ locations need this.
//
// Why admin client: called from an OAuth callback route that has no user session
// (the callback is a redirect from GHL, not an authenticated request). RLS would
// block the write, so we use service-role to bypass it.
//
// Errors are thrown so the caller (oauth-callback.ts) can decide how to handle
// them — a location sync failure shouldn't abort the connect flow, but we want
// visibility into what went wrong.
export async function syncGHLLocations(
  orgId: string,
  companyId: string,
  accessToken: string
): Promise<void> {
  const allLocations: GHLLocation[] = [];
  let skip = 0;

  // Paginate until we've fetched all locations
  while (true) {
    const res = await ghlFetch(
      `/locations/search?companyId=${companyId}&limit=${PAGE_LIMIT}&skip=${skip}`,
      accessToken
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "(no body)");
      throw new Error(`GHL location list failed (${res.status}): ${body}`);
    }

    const data = await res.json() as GHLLocationsResponse;
    const page = data.locations ?? [];
    allLocations.push(...page);

    // Stop when this page is smaller than the limit — no more pages
    if (page.length < PAGE_LIMIT) break;
    skip += PAGE_LIMIT;
  }

  if (allLocations.length === 0) return;

  const admin = createAdminClient();

  // Upsert all locations in a single call.
  // onConflict org_id,location_id — re-running sync after reconnect updates the name.
  // We don't overwrite access_token/refresh_token/status here — those are managed
  // by the per-location sub-account OAuth flow in /api/integrations/loc/callback.
  await admin.from("ghl_locations").upsert(
    allLocations.map((loc) => ({
      org_id: orgId,
      location_id: loc.id,
      location_name: loc.name,
      company_id: companyId,
    })),
    { onConflict: "org_id,location_id" }
  );
}
