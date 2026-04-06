import { NextRequest } from "next/server";
import { handleOAuthCallback } from "@/lib/oauth-callback";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/oauth-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!OAUTH_PROVIDERS[provider as OAuthProvider]) {
    return new Response("Unknown provider", { status: 400 });
  }
  return handleOAuthCallback(request, provider as OAuthProvider);
}
