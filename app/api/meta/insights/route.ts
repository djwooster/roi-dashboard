import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GRAPH = "https://graph.facebook.com/v19.0";

// Fallback IDs for the founder's system user token, which can't use /me/adaccounts.
// Customer OAuth tokens don't need this — /me/adaccounts works for them directly.
const FOUNDER_BUSINESS_ID = process.env.META_FOUNDER_BUSINESS_ID ?? "";
const FOUNDER_ACCOUNT_ID = process.env.META_FOUNDER_ACCOUNT_ID ?? "";

type AdAccount = {
  id: string;
  name: string;
  account_status: number;
};

type InsightAction = {
  action_type: string;
  value: string;
};

type RawInsight = {
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: InsightAction[];
  action_values?: InsightAction[];
};

export type MetaAccountInsights = {
  account_id: string;
  account_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  revenue: number;
};

export type MetaInsightsResponse = {
  accounts: MetaAccountInsights[];
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    revenue: number;
  };
};

function sumActions(actions: InsightAction[] | undefined, type: string): number {
  if (!actions) return 0;
  const match = actions.find((a) => a.action_type === type);
  return match ? parseFloat(match.value) : 0;
}

async function discoverAccounts(token: string): Promise<AdAccount[]> {
  const requests: Promise<Response>[] = [
    fetch(`${GRAPH}/me/adaccounts?fields=id,name,account_status&access_token=${token}`),
  ];
  if (FOUNDER_BUSINESS_ID) {
    requests.push(fetch(`${GRAPH}/${FOUNDER_BUSINESS_ID}/owned_ad_accounts?fields=id,name,account_status&access_token=${token}`));
  }
  if (FOUNDER_ACCOUNT_ID) {
    requests.push(fetch(`${GRAPH}/${FOUNDER_ACCOUNT_ID}?fields=id,name,account_status&access_token=${token}`));
  }

  const [meRes, bizRes, directRes] = await Promise.all(requests);

  const me = await meRes.json() as { data?: AdAccount[] };
  const biz = bizRes ? await bizRes.json() as { data?: AdAccount[] } : null;
  const direct = directRes ? await directRes.json() as AdAccount & { error?: unknown } : null;

  const all: AdAccount[] = [
    ...(me.data ?? []),
    ...(biz?.data ?? []),
    ...(direct && !direct.error && direct.id ? [direct] : []),
  ];

  // Deduplicate
  const seen = new Set<string>();
  return all.filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
}

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { data: integration, error } = await supabase
    .from("integrations")
    .select("access_token")
    .eq("org_id", orgId)
    .eq("provider", "facebook")
    .eq("status", "active")
    .single();

  if (error || !integration) {
    return NextResponse.json({ error: "Facebook not connected" }, { status: 404 });
  }

  const token = integration.access_token;
  const accounts = await discoverAccounts(token);
  const activeAccounts = accounts.filter((a) => a.account_status === 1);

  const results: MetaAccountInsights[] = await Promise.all(
    activeAccounts.map(async (account) => {
      const res = await fetch(
        `${GRAPH}/${account.id}/insights` +
          `?fields=spend,impressions,clicks,actions,action_values` +
          `&date_preset=maximum` +
          `&access_token=${token}`
      );
      const data = await res.json() as { data?: RawInsight[] };
      const row: RawInsight = data.data?.[0] ?? {};

      return {
        account_id: account.id,
        account_name: account.name,
        spend: parseFloat(row.spend ?? "0"),
        impressions: parseInt(row.impressions ?? "0", 10),
        clicks: parseInt(row.clicks ?? "0", 10),
        leads:
          sumActions(row.actions, "lead_generation") ||
          sumActions(row.actions, "lead") ||
          sumActions(row.actions, "onsite_conversion.lead_grouped"),
        revenue:
          sumActions(row.action_values, "purchase") ||
          sumActions(row.action_values, "omni_purchase"),
      };
    })
  );

  const totals = results.reduce(
    (acc, r) => ({
      spend: acc.spend + r.spend,
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      leads: acc.leads + r.leads,
      revenue: acc.revenue + r.revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, revenue: 0 }
  );

  return NextResponse.json({ accounts: results, totals } satisfies MetaInsightsResponse);
}
