// Shared GHL API client utilities.
// All GHL API calls go through ghlFetch so the base URL and version header
// are never duplicated across files.

export const GHL_API = "https://services.leadconnectorhq.com";
export const GHL_VERSION = "2021-07-28";

export async function ghlFetch(path: string, token: string) {
  return fetch(`${GHL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_VERSION,
    },
  });
}
