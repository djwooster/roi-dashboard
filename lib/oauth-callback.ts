import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OAUTH_PROVIDERS, getCallbackUrl, type OAuthProvider } from "@/lib/oauth-config";
import { syncGHLLocations } from "@/lib/ghl/syncLocations";

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

  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const supabase = await createClient();

  let providerUserId: string | null = null;
  if (provider === "ghl") {
    // GHL agency OAuth: token response includes companyId (agency-level connection).
    // Single-location OAuth: only locationId is present.
    // We prefer companyId so the integration row represents the whole agency account.
    // After storing tokens, we sync all sub-account locations into ghl_locations.
    const companyId = typeof tokens.companyId === "string" ? tokens.companyId : null;
    const locationId = typeof tokens.locationId === "string" ? tokens.locationId : null;
    providerUserId = companyId ?? locationId;
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

  // After a GHL agency connect, enumerate all sub-account locations and store
  // them in ghl_locations. This is what enables the client switcher.
  // We only do this when companyId is in the token response — single-location
  // connects skip this and the sync route falls back to provider_user_id.
  if (provider === "ghl" && typeof tokens.companyId === "string") {
    try {
      await syncGHLLocations(parsedState.orgId, tokens.companyId, tokens.access_token);
    } catch (err) {
      // Location sync is best-effort — the integration itself is already saved.
      // Log the error but don't fail the entire OAuth flow over it.
      console.error("[GHL] location sync failed after connect:", err);
    }
  }

  const response = NextResponse.redirect(dashboardUrl.toString());
  response.cookies.delete("oauth_nonce");
  return response;
}
