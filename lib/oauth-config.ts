export type OAuthProvider = "google" | "facebook" | "ghl" | "hubspot" | "salesforce" | "jobber";

type ProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  /** URL to fetch the authenticated user's ID after token exchange (provider-specific) */
  userIdUrl?: string;
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
    scopes: ["ads_read", "ads_management", "read_insights", "leads_retrieval"],
    clientIdEnv: "FACEBOOK_APP_ID",
    clientSecretEnv: "FACEBOOK_APP_SECRET",
    userIdUrl: "https://graph.facebook.com/v19.0/me",
  },
  ghl: {
    authUrl: "https://marketplace.gohighlevel.com/oauth/chooselocation",
    tokenUrl: "https://services.leadconnectorhq.com/oauth/token",
    scopes: ["contacts.readonly", "opportunities.readonly"],
    clientIdEnv: "GHL_CLIENT_ID",
    clientSecretEnv: "GHL_CLIENT_SECRET",
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
  return `${base}/api/integrations/${provider}/callback`;
}
