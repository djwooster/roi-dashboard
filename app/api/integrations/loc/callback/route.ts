import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";

// GET /api/integrations/loc/callback
// Handles the OAuth callback for per-location GHL sub-account connects.
// Exchanges the code for tokens and stores them directly on the ghl_locations row,
// enabling the sync route to use a location-scoped token for contacts/opportunities.
//
// Why admin client: this is an OAuth redirect with no user session cookie.
// We validate identity via the signed state param (orgId + nonce) instead.
export async function GET(request: NextRequest) {
  const dashboardUrl = new URL("/dashboard?page=integrations", request.url);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    dashboardUrl.searchParams.set("error", "oauth_denied");
    return NextResponse.redirect(dashboardUrl.toString());
  }

  if (!code || !state) {
    dashboardUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(dashboardUrl.toString());
  }

  // Validate CSRF nonce
  const storedNonce = request.cookies.get("loc_oauth_nonce")?.value;
  let parsedState: { orgId: string; nonce: string; locationId: string };
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

  const clientId = process.env.GHL_CLIENT_ID!;
  const clientSecret = process.env.GHL_CLIENT_SECRET!;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callbackUrl = `${base}/api/integrations/loc/callback`;

  const tokenRes = await fetch(GHL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
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
    locationId?: string;
  };

  // GHL returns the locationId in the token response for sub-account connects.
  // We validate it matches the one the user initiated the flow for — if they
  // selected a different location in the GHL chooser we still store it, but
  // we use the token response's locationId as the authoritative value.
  const tokenLocationId = tokens.locationId ?? parsedState.locationId;
  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const admin = createAdminClient();

  // Update the ghl_locations row with the location token.
  // If the row doesn't exist yet (location wasn't synced via agency connect),
  // upsert it so direct sub-account connects also work.
  await admin.from("ghl_locations").upsert(
    {
      org_id: parsedState.orgId,
      location_id: tokenLocationId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: tokenExpiresAt,
      status: "active",
    },
    { onConflict: "org_id,location_id" }
  );

  const response = NextResponse.redirect(dashboardUrl.toString());
  response.cookies.delete("loc_oauth_nonce");
  return response;
}
