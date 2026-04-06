import { NextRequest } from "next/server";
import { handleOAuthCallback } from "@/lib/oauth-callback";

// GHL blocks redirect URIs containing "ghl" — this alias is used instead.
// Set redirect URI in GHL developer portal to: {APP_URL}/api/integrations/crm/callback
export async function GET(request: NextRequest) {
  return handleOAuthCallback(request, "ghl");
}
