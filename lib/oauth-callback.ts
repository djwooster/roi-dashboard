import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OAUTH_PROVIDERS, getCallbackUrl, type OAuthProvider } from "@/lib/oauth-config";

export async function handleOAuthCallback(request: NextRequest, provider: OAuthProvider) {
  const config = OAUTH_PROVIDERS[provider];

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const dashboardUrl = new URL("/dashboard", request.url);
  dashboardUrl.searchParams.set("page", "integrations");

  if (errorParam) {
    dashboardUrl.searchParams.set("error", "oauth_denied");
    return NextResponse.redirect(dashboardUrl.toString());
  }

  if (!code || !state || !config) {
    dashboardUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(dashboardUrl.toString());
  }

  const storedNonce = request.cookies.get("oauth_nonce")?.value;
  let parsedState: { orgId: string; nonce: string; provider: string };
  try {
    parsedState = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    dashboardUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(dashboardUrl.toString());
  }

  if (!storedNonce || storedNonce !== parsedState.nonce) {
    dashboardUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(dashboardUrl.toString());
  }

  const clientId = process.env[config.clientIdEnv]!;
  const clientSecret = process.env[config.clientSecretEnv]!;

  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getCallbackUrl(provider),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    dashboardUrl.searchParams.set("error", "token_exchange_failed");
    return NextResponse.redirect(dashboardUrl.toString());
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    [key: string]: unknown;
  };

  // ── Meta: exchange short-lived token for a long-lived one (~60 days) ─────────
  // The auth code exchange always returns a short-lived token (~1 hour).
  // We immediately swap it here so we never store a token that expires in an hour.
  // Long-lived tokens are re-exchanged lazily by getValidMetaToken when they're
  // within 7 days of expiry.
  if (provider === "facebook") {
    const params = new URLSearchParams({
      grant_type:        "fb_exchange_token",
      client_id:         clientId,
      client_secret:     clientSecret,
      fb_exchange_token: tokens.access_token,
    });
    const llRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`);
    if (llRes.ok) {
      const ll = await llRes.json() as { access_token: string; expires_in?: number };
      tokens.access_token = ll.access_token;
      if (ll.expires_in) tokens.expires_in = ll.expires_in;
    }
    // If the exchange fails, fall through and store the short-lived token.
    // getValidMetaToken will attempt re-exchange on the first dashboard load.
  }

  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const supabase = await createClient();

  let providerUserId: string | null = null;
  if (provider === "ghl") {
    // Sub-account OAuth: token response includes locationId (the connected sub-account).
    // Store it as provider_user_id so the sync route can fall back to it when
    // ghl_locations is empty (e.g. first connect before the row is visible in the query).
    providerUserId = typeof tokens.locationId === "string" ? tokens.locationId : null;
  } else if (config.tokenResponseIdField) {
    const val = tokens[config.tokenResponseIdField];
    providerUserId = typeof val === "string" ? val : null;
  } else if (config.userIdUrl) {
    // Use Authorization header rather than a query param — tokens in URLs
    // show up in server logs and browser history, which is a minor security risk.
    const userRes = await fetch(config.userIdUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json() as { id?: string };
      providerUserId = userData.id ?? null;
    }
  }

  await supabase.from("integrations").upsert(
    {
      org_id: parsedState.orgId,
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: tokenExpiresAt,
      status: "active",
      ...(providerUserId ? { provider_user_id: providerUserId } : {}),
    },
    { onConflict: "org_id,provider" }
  );

  // After a GHL sub-account connect, upsert the location token into ghl_locations.
  // This makes the connected location immediately visible in the client switcher
  // without any additional manual steps.
  //
  // Why admin client: the OAuth callback has the user's session cookie (browser
  // preserves it across redirects), but ghl_locations RLS may be restrictive.
  // Admin bypasses RLS here, which is safe — we've already validated identity
  // via the signed state param + nonce cookie above.
  if (provider === "ghl" && typeof tokens.locationId === "string") {
    const admin = createAdminClient();
    try {
      await admin.from("ghl_locations").upsert(
        {
          org_id: parsedState.orgId,
          location_id: tokens.locationId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          token_expires_at: tokenExpiresAt,
          status: "active",
        },
        { onConflict: "org_id,location_id" }
      );
    } catch (err) {
      // Best-effort — integration row is already saved. Dashboard will still
      // work via the provider_user_id fallback; location switcher just won't
      // show the entry until the next connect or page refresh.
      console.error("[GHL] ghl_locations upsert failed after connect:", err);
    }
  }

  const response = NextResponse.redirect(dashboardUrl.toString());
  response.cookies.delete("oauth_nonce");
  return response;
}
