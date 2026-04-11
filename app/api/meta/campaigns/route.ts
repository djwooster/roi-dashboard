import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GRAPH = "https://graph.facebook.com/v19.0";

// Fallback IDs for the founder's system user token — mirrors the same workaround
// in /api/meta/insights/route.ts. Customer OAuth tokens use /me/adaccounts directly.
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

type CampaignInsightRow = {
  campaign_name: string;
  spend?: string;
  actions?: InsightAction[];
  action_values?: InsightAction[];
};

export type MetaCampaign = {
  name: string;
  spend: number;
  leads: number;
  revenue: number;
  cpl: number;
  roas: number;
};

export type MetaCampaignsResponse = {
  campaigns: MetaCampaign[];
};

function sumActions(actions: InsightAction[] | undefined, type: string): number {
  if (!actions) return 0;
  const match = actions.find((a) => a.action_type === type);
  return match ? parseFloat(match.value) : 0;
}

// Discover all active ad accounts for a given Meta token.
// Duplicated from /api/meta/insights to avoid a premature shared utility —
// if a third route needs this, extract to lib/meta/accounts.ts at that point.
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

  const seen = new Set<string>();
  return all.filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
}

// GET /api/meta/campaigns
// Returns per-campaign spend, leads, revenue, CPL, and ROAS for all active Meta
// ad accounts connected to this org. Uses level=campaign on the insights endpoint
// so we get one row per campaign in a single API call per account (no N+1).
//
// Results are sorted by leads descending — highest-volume campaigns first.
// The dashboard "Top Campaigns" section shows the top 10.
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

  // Fetch campaign-level insights for all accounts in parallel.
  // level=campaign tells Meta to break down the insights by campaign rather than
  // returning a single aggregate row for the account.
  const perAccountResults = await Promise.all(
    activeAccounts.map(async (account) => {
      const res = await fetch(
        `${GRAPH}/${account.id}/insights` +
          `?level=campaign` +
          `&fields=campaign_name,spend,actions,action_values` +
          `&date_preset=maximum` +
          `&limit=50` +
          `&access_token=${token}`
      );
      const data = await res.json() as { data?: CampaignInsightRow[] };
      return data.data ?? [];
    })
  );

  // Flatten across accounts, then aggregate campaigns with the same name
  // (edge case: same campaign name across multiple accounts merges cleanly).
  const aggregated = new Map<string, MetaCampaign>();
  for (const rows of perAccountResults) {
    for (const row of rows) {
      const name = row.campaign_name;
      const spend = parseFloat(row.spend ?? "0");
      const leads =
        sumActions(row.actions, "lead_generation") ||
        sumActions(row.actions, "lead") ||
        sumActions(row.actions, "onsite_conversion.lead_grouped");
      const revenue =
        sumActions(row.action_values, "purchase") ||
        sumActions(row.action_values, "omni_purchase");

      const existing = aggregated.get(name);
      if (existing) {
        existing.spend += spend;
        existing.leads += leads;
        existing.revenue += revenue;
        existing.cpl = existing.leads > 0 ? existing.spend / existing.leads : 0;
        existing.roas = existing.spend > 0 ? existing.revenue / existing.spend : 0;
      } else {
        aggregated.set(name, {
          name,
          spend,
          leads,
          revenue,
          cpl: leads > 0 ? spend / leads : 0,
          roas: spend > 0 ? revenue / spend : 0,
        });
      }
    }
  }

  // Sort by leads descending — most productive campaigns first.
  // Take top 10 to keep the table scannable.
  const campaigns = Array.from(aggregated.values())
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10);

  return NextResponse.json({ campaigns } satisfies MetaCampaignsResponse);
}
