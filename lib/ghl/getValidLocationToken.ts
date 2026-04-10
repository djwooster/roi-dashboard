import { createAdminClient } from "@/lib/supabase/admin";

const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";

// How many seconds before expiry we proactively refresh.
// Matches the buffer used in getValidGHLToken for consistency.
const REFRESH_BUFFER_SECONDS = 5 * 60;

type GHLTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

// Returns a valid GHL access token for a specific location, refreshing if needed.
// Returns null if no location token has been stored (location not yet connected
// via sub-account OAuth) — callers should handle this gracefully.
//
// Why a separate function from getValidGHLToken:
// Agency connects store tokens in the `integrations` table (company-level).
// Per-location connects store tokens directly in `ghl_locations` (location-level).
// These use different Supabase tables and different GHL app credentials (sub-account
// client ID/secret rather than the agency client ID/secret).
//
// Why admin client: called from API routes where RLS scoping isn't available.
export async function getValidLocationToken(
  orgId: string,
  locationId: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data: loc } = await admin
    .from("ghl_locations")
    .select("access_token, refresh_token, token_expires_at, status")
    .eq("org_id", orgId)
    .eq("location_id", locationId)
    .single();

  // Location exists but hasn't been connected via sub-account OAuth yet
  if (!loc || loc.status !== "active" || !loc.access_token) return null;

  const { access_token, refresh_token, token_expires_at } = loc;

  if (!refresh_token) return access_token;

  const expiresAt = token_expires_at ? new Date(token_expires_at).getTime() : 0;
  const bufferMs = REFRESH_BUFFER_SECONDS * 1000;
  const needsRefresh = !expiresAt || Date.now() + bufferMs >= expiresAt;

  if (!needsRefresh) return access_token;

  // Refresh using sub-account app credentials — not the agency app credentials
  const res = await fetch(GHL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.GHL_SUBACCOUNT_CLIENT_ID!,
      client_secret: process.env.GHL_SUBACCOUNT_CLIENT_SECRET!,
      refresh_token,
    }),
  });

  if (!res.ok) {
    // Mark location as needing reconnect rather than returning stale token
    await admin
      .from("ghl_locations")
      .update({ status: "pending" })
      .eq("org_id", orgId)
      .eq("location_id", locationId);
    return null;
  }

  const tokens = await res.json() as GHLTokenResponse;
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await admin
    .from("ghl_locations")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpiresAt,
    })
    .eq("org_id", orgId)
    .eq("location_id", locationId);

  return tokens.access_token;
}
