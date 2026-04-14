import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ghlFetch } from "@/lib/ghl/api";

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
  // locationId is optional in state — it's omitted when adding a new sub-account
  // (the user picked the location in GHL's chooser; we get the id from the token response).
  let parsedState: { orgId: string; nonce: string; locationId?: string };
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
  // Use it as the authoritative value — it's correct even if the user picked a
  // different location than the one the flow was initiated for.
  const tokenLocationId = tokens.locationId ?? parsedState.locationId;
  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // Fetch the location name and companyId so the row has a display name in the
  // client switcher — especially important for new sub-account adds where no row
  // existed yet and the name wouldn't be populated from anywhere else.
  type GHLLocationDetail = { location?: { name?: string; companyId?: string } };
  let locationName: string | undefined;
  let companyId: string | undefined;
  if (tokenLocationId) {
    try {
      const locRes = await ghlFetch(`/locations/${tokenLocationId}`, tokens.access_token);
      if (locRes.ok) {
        const locData = await locRes.json() as GHLLocationDetail;
        locationName = locData.location?.name;
        companyId = locData.location?.companyId;
      }
    } catch {
      // Non-fatal — location will appear in the switcher with a blank name rather
      // than blocking the connect flow. The user can rename it in GHL and reconnect.
    }
  }

  const admin = createAdminClient();

  // Upsert the ghl_locations row with the token + name.
  // Creates the row if it doesn't exist (new sub-account add via chooser).
  // Updates token fields if the row already exists (reconnect flow).
  await admin.from("ghl_locations").upsert(
    {
      org_id: parsedState.orgId,
      location_id: tokenLocationId,
      ...(locationName && { location_name: locationName }),
      ...(companyId && { company_id: companyId }),
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
