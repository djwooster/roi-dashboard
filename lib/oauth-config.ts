export type OAuthProvider = "facebook" | "ghl" | "hubspot" | "salesforce" | "jobber";

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
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: ["ads_read"],
    clientIdEnv: "FACEBOOK_APP_ID",
    clientSecretEnv: "FACEBOOK_APP_SECRET",
    userIdUrl: "https://graph.facebook.com/v19.0/me",
  },
  ghl: {
    authUrl: "https://marketplace.gohighlevel.com/oauth/chooselocation",
    tokenUrl: "https://services.leadconnectorhq.com/oauth/token",
    // Sub-account scopes — one app, one OAuth flow per location.
    // GHL's chooselocation screen lets the user pick which sub-account to connect;
    // the resulting token is scoped to that location only.
    // calendars.readonly — required for GET /calendars/ (list calendars for a location).
    // calendars/events.readonly — required for GET /calendars/events (appointment list).
    // calendars/events.write — write show/no-show status back to GHL appointments.
    scopes: [
      "contacts.readonly",
      "opportunities.readonly",
      "calendars.readonly",
      "calendars/events.readonly",
      "calendars/events.write",
    ],
    clientIdEnv: "GHL_CLIENT_ID",
    clientSecretEnv: "GHL_CLIENT_SECRET",
    // Sub-account token response always includes locationId (not companyId).
    // oauth-callback.ts uses this to store the token in both integrations and
    // ghl_locations so the client switcher picks it up automatically.
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
