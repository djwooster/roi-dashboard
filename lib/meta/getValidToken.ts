import { createAdminClient } from "@/lib/supabase/admin";

const GRAPH = "https://graph.facebook.com/v19.0";

// How many seconds before expiry we proactively re-exchange the token.
// 7 days gives plenty of runway — long-lived tokens last ~60 days, so a
// 7-day window means we refresh on the first report/dashboard load of the
// final week rather than cutting it close.
const REFRESH_BUFFER_SECONDS = 7 * 24 * 60 * 60;

type MetaTokenResponse = {
  access_token: string;
  token_type:   string;
  expires_in?:  number; // seconds; omitted if the token never expires (rare)
};

// Returns a valid Meta access token for the given org, re-exchanging it first
// if it's expired or about to expire within the 7-day buffer.
//
// Why admin client: called from server-side routes and the public report page,
// neither of which can rely on a user session for the integrations table lookup.
//
// Why we throw instead of returning null:
// A failed token means Meta data is unavailable. Throwing lets callers fall back
// gracefully (e.g. return null for metaData) rather than silently serving stale data.
//
// Re-exchange mechanism:
// Meta long-lived tokens (~60 days) don't use a refresh_token grant — instead
// you pass the existing long-lived token back to the fb_exchange_token endpoint
// to receive a fresh 60-day token. This is idempotent: calling it early just
// resets the clock without invalidating anything.
export async function getValidMetaToken(orgId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: integration, error } = await admin
    .from("integrations")
    .select("access_token, token_expires_at")
    .eq("org_id", orgId)
    .eq("provider", "facebook")
    .eq("status", "active")
    .single();

  if (error || !integration) {
    throw new Error("Meta integration not found or inactive");
  }

  const { access_token, token_expires_at } = integration;

  // If no expiry is stored (shouldn't happen after this deploy, but handles
  // tokens stored before long-lived exchange was implemented) treat as needing refresh.
  const expiresAt = token_expires_at ? new Date(token_expires_at).getTime() : 0;
  const bufferMs  = REFRESH_BUFFER_SECONDS * 1000;
  const needsRefresh = !expiresAt || Date.now() + bufferMs >= expiresAt;

  if (!needsRefresh) {
    return access_token;
  }

  // --- Token re-exchange ---
  // Uses the fb_exchange_token grant, passing the current long-lived token.
  // Short-lived tokens (from pre-fix connects) are also accepted here, so this
  // also heals any tokens that were stored before the callback exchange was added.
  const params = new URLSearchParams({
    grant_type:        "fb_exchange_token",
    client_id:         process.env.FACEBOOK_APP_ID!,
    client_secret:     process.env.FACEBOOK_APP_SECRET!,
    fb_exchange_token: access_token,
  });

  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`);

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    // Mark inactive so the dashboard shows "reconnect" rather than silently
    // returning empty data on every subsequent request.
    await admin
      .from("integrations")
      .update({ status: "inactive" })
      .eq("org_id", orgId)
      .eq("provider", "facebook");

    throw new Error(`Meta token re-exchange failed (${res.status}): ${body}`);
  }

  const tokens = await res.json() as MetaTokenResponse;

  const newExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  await admin
    .from("integrations")
    .update({
      access_token:     tokens.access_token,
      token_expires_at: newExpiresAt,
    })
    .eq("org_id", orgId)
    .eq("provider", "facebook");

  return tokens.access_token;
}
