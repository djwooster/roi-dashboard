import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

// Sub-account OAuth config lives here rather than in oauth-config.ts because
// this route is standalone — it's not part of the generic [provider] OAuth flow.
// GHL blocks redirect URIs containing "ghl", so we use /loc/ as a neutral path.
const GHL_AUTH_URL = "https://marketplace.gohighlevel.com/oauth/chooselocation";
const SCOPES = [
  "contacts.readonly",
  "opportunities.readonly",
  // Calendar scopes required by fetchAppointments — must also be enabled in the
  // GHL Marketplace app settings or GHL will silently omit them from the token.
  "calendars.readonly",
  "calendars/events.readonly",
];

// GET /api/integrations/loc/connect?locationId={id}
// Builds the GHL sub-account OAuth URL for a specific location.
// The locationId is embedded in state so the callback knows which ghl_locations
// row to update with the resulting token.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.redirect(new URL("/onboarding", request.url));

  // locationId is optional — when present the user is reconnecting an existing
  // sub-account; when absent (Add client flow) GHL shows a chooser and returns
  // the selected locationId in the token response.
  const locationId = request.nextUrl.searchParams.get("locationId") ?? undefined;

  const clientId = process.env.GHL_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/dashboard?page=integrations&error=provider_not_configured", request.url)
    );
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callbackUrl = `${base}/api/integrations/loc/callback`;

  const nonce = randomBytes(16).toString("hex");
  // locationId included only when reconnecting; omitted for new sub-account adds.
  // The callback uses tokens.locationId (from GHL's response) as the authoritative value.
  const state = Buffer.from(JSON.stringify({ orgId, nonce, ...(locationId && { locationId }) })).toString("base64url");

  const authUrl = new URL(GHL_AUTH_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES.join(" "));
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("loc_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
