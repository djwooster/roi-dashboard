import { createAdminClient } from "@/lib/supabase/admin";

const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";

// How many seconds before expiry we proactively refresh the token.
// 5 minutes gives us a buffer against clock skew and slow API responses —
// a token that expires in 30 seconds could fail mid-request.
const REFRESH_BUFFER_SECONDS = 5 * 60;

type GHLTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
};

// Returns a valid GHL access token for the given org, refreshing it first if
// it's expired or about to expire.
//
// Why we use the admin client here:
// This function is called from API routes that have already verified the user's
// identity. The integrations table is read/written with service-role access
// because RLS on that table is scoped to the user's session, which isn't
// available in server-side utility functions.
//
// Why we throw instead of returning null on refresh failure:
// A failed refresh means the token is unusable. Returning null would silently
// produce empty data in the dashboard. Throwing lets the calling route return
// a clear error so the user knows to reconnect GHL.
export async function getValidGHLToken(orgId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: integration, error } = await admin
    .from("integrations")
    .select("access_token, refresh_token, token_expires_at")
    .eq("org_id", orgId)
    .eq("provider", "ghl")
    .eq("status", "active")
    .single();

  if (error || !integration) {
    throw new Error("GHL integration not found or inactive");
  }

  const { access_token, refresh_token, token_expires_at } = integration;

  if (!refresh_token) {
    // No refresh token stored — token was issued without one (unusual for GHL).
    // Return whatever we have and let the caller fail naturally if it's expired.
    return access_token;
  }

  // Check whether the token needs refreshing.
  // We refresh if: no expiry is stored, OR the token expires within the buffer window.
  const expiresAt = token_expires_at ? new Date(token_expires_at).getTime() : 0;
  const bufferMs = REFRESH_BUFFER_SECONDS * 1000;
  const needsRefresh = !expiresAt || Date.now() + bufferMs >= expiresAt;

  if (!needsRefresh) {
    return access_token;
  }

  // --- Token refresh ---
  // GHL uses the standard OAuth2 refresh_token grant. Client credentials are
  // required in the body (GHL doesn't support the Authorization header approach).
  const res = await fetch(GHL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.GHL_CLIENT_ID!,
      client_secret: process.env.GHL_CLIENT_SECRET!,
      refresh_token,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    // Mark the integration inactive so the dashboard shows "reconnect" instead
    // of silently returning stale/empty data on every subsequent request.
    await admin
      .from("integrations")
      .update({ status: "inactive" })
      .eq("org_id", orgId)
      .eq("provider", "ghl");

    throw new Error(`GHL token refresh failed (${res.status}): ${body}`);
  }

  const tokens = await res.json() as GHLTokenResponse;

  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await admin
    .from("integrations")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpiresAt,
    })
    .eq("org_id", orgId)
    .eq("provider", "ghl");

  return tokens.access_token;
}
