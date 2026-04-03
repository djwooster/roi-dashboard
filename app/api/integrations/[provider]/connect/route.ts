import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { OAUTH_PROVIDERS, getCallbackUrl, type OAuthProvider } from "@/lib/oauth-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const config = OAUTH_PROVIDERS[provider as OAuthProvider];

  if (!config) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=provider_not_configured&provider=${provider}`, request.url)
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const orgId = user.user_metadata?.org_id;
  if (!orgId) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Generate a nonce to verify on callback (CSRF protection)
  const nonce = randomBytes(16).toString("hex");
  const state = Buffer.from(JSON.stringify({ orgId, nonce, provider })).toString("base64url");

  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", getCallbackUrl(provider as OAuthProvider));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scopes.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline"); // needed for refresh tokens (Google)
  authUrl.searchParams.set("prompt", "consent"); // force refresh token on re-auth

  const response = NextResponse.redirect(authUrl.toString());
  // Store nonce in a short-lived cookie to verify on callback
  response.cookies.set("oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
