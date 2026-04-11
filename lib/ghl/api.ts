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

// PUT variant — used for write-back operations (e.g. updating appointment status).
// Separate from ghlFetch to keep the common GET path simple.
export async function ghlPut(path: string, token: string, body: unknown) {
  return fetch(`${GHL_API}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
