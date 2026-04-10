export type OAuthProvider = "google" | "facebook" | "ghl" | "hubspot" | "salesforce" | "jobber";

type ProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  /** URL to fetch the authenticated user's ID after token exchange (provider-specific) */
  userIdUrl?: string;
  /** Field in the token response body to use as provider_user_id (skips the userIdUrl fetch) */
  tokenResponseIdField?: string;
};

export const OAUTH_PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/adwords"],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: ["ads_read", "ads_management", "leads_retrieval"],
    clientIdEnv: "FACEBOOK_APP_ID",
    clientSecretEnv: "FACEBOOK_APP_SECRET",
    userIdUrl: "https://graph.facebook.com/v19.0/me",
  },
  ghl: {
    authUrl: "https://marketplace.gohighlevel.com/oauth/chooselocation",
    tokenUrl: "https://services.leadconnectorhq.com/oauth/token",
    // companies.readonly + locations.readonly are agency-level scopes — they unlock
    // companyId in the token response and allow sub-account enumeration via syncLocations.
    // contacts.readonly + opportunities.readonly are NOT valid for agency apps (GHL
    // enforces scope separation by app type). Instead, the sync route exchanges the
    // company token for a location-scoped token on each data fetch via getLocationToken.
    scopes: [
      "companies.readonly",
      "locations.readonly",
    ],
    clientIdEnv: "GHL_CLIENT_ID",
    clientSecretEnv: "GHL_CLIENT_SECRET",
    // GHL returns either companyId (agency mode) or locationId (single-location mode)
    // in the token response. We handle the priority in oauth-callback.ts because we
    // need to branch behavior (location sync vs. simple store), not just pick a field.
    tokenResponseIdField: "locationId",
  },
  hubspot: {
    authUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    scopes: ["crm.objects.contacts.read", "crm.objects.deals.read"],
    clientIdEnv: "HUBSPOT_CLIENT_ID",
    clientSecretEnv: "HUBSPOT_CLIENT_SECRET",
  },
  salesforce: {
    authUrl: "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://login.salesforce.com/services/oauth2/token",
    scopes: ["api"],
    clientIdEnv: "SALESFORCE_CLIENT_ID",
    clientSecretEnv: "SALESFORCE_CLIENT_SECRET",
  },
  jobber: {
    authUrl: "https://api.getjobber.com/api/oauth/authorize",
    tokenUrl: "https://api.getjobber.com/api/oauth/token",
    scopes: ["read_clients", "read_jobs"],
    clientIdEnv: "JOBBER_CLIENT_ID",
    clientSecretEnv: "JOBBER_CLIENT_SECRET",
  },
};

export function getCallbackUrl(provider: OAuthProvider): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  // GHL blocks redirect URIs containing "ghl" — use the neutral /crm/callback alias
  if (provider === "ghl") return `${base}/api/integrations/crm/callback`;
  return `${base}/api/integrations/${provider}/callback`;
}
