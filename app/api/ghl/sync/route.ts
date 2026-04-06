import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

type GHLContact = { id: string };
type GHLOpportunity = { monetaryValue?: number };

type GHLListResponse<T> = {
  meta?: { total?: number };
  contacts?: T[];
  opportunities?: T[];
};

export type GHLSyncResponse = {
  contacts: number;
  opportunities: number;
  closedRevenue: number;
};

async function ghlFetch(path: string, token: string) {
  return fetch(`${GHL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_VERSION,
    },
  });
}

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { data: integration } = await supabase
    .from("integrations")
    .select("access_token, provider_user_id")
    .eq("org_id", orgId)
    .eq("provider", "ghl")
    .eq("status", "active")
    .single();

  if (!integration) {
    return NextResponse.json({ error: "GHL not connected" }, { status: 404 });
  }

  const { access_token: token, provider_user_id: locationId } = integration;

  if (!locationId) {
    return NextResponse.json({ error: "No GHL location ID stored" }, { status: 400 });
  }

  const [contactsRes, oppsRes, wonRes] = await Promise.all([
    ghlFetch(`/contacts/?locationId=${locationId}&limit=1`, token),
    ghlFetch(`/opportunities/search?location_id=${locationId}&limit=1`, token),
    ghlFetch(`/opportunities/search?location_id=${locationId}&status=won&limit=100`, token),
  ]);

  const [contactsData, oppsData, wonData] = await Promise.all([
    contactsRes.json() as Promise<GHLListResponse<GHLContact>>,
    oppsRes.json() as Promise<GHLListResponse<GHLOpportunity>>,
    wonRes.json() as Promise<GHLListResponse<GHLOpportunity>>,
  ]);

  const contacts = contactsData.meta?.total ?? 0;
  const opportunities = oppsData.meta?.total ?? 0;
  const closedRevenue = (wonData.opportunities ?? []).reduce(
    (sum, o) => sum + (o.monetaryValue ?? 0),
    0
  );

  return NextResponse.json({ contacts, opportunities, closedRevenue } satisfies GHLSyncResponse);
}
