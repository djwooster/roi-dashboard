import { GHL_API, GHL_VERSION } from "./api";

// Exchanges a company-level (agency) GHL token for a location-scoped token.
//
// Why this is needed:
// The agency OAuth app uses companies.readonly + locations.readonly scopes —
// these let us enumerate sub-accounts but do NOT grant access to contacts or
// opportunities. Location-level data endpoints require a token issued for that
// specific location. GHL provides this exchange endpoint so agency apps can
// access sub-account data without requiring a separate OAuth connect per location.
//
// Throws if the exchange fails — callers should catch and fall back to the
// company token (which may still work for some endpoints, and is correct for
// sub-account connects where no exchange is needed).
export async function getLocationToken(
  companyId: string,
  locationId: string,
  companyToken: string,
): Promise<string> {
  const res = await fetch(`${GHL_API}/oauth/locationToken`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${companyToken}`,
      Version: GHL_VERSION,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ companyId, locationId }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`GHL location token exchange failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { access_token: string };

  if (!data.access_token) {
    throw new Error("GHL location token exchange returned no access_token");
  }

  return data.access_token;
}
