import { notFound } from "next/navigation";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";
import { getValidLocationToken } from "@/lib/ghl/getValidLocationToken";
import { fetchLocationData, type GHLDateRange } from "@/lib/ghl/fetchLocationData";
import { fetchAppointments, getAppointmentContactName, getAppointmentDate } from "@/lib/ghl/fetchAppointments";
import { generateReportSummary, type SummarySection } from "@/lib/ai/generateReportSummary";
import AppointmentConfirmList, { type AppointmentItem } from "@/components/AppointmentConfirmList";
import type { GHLPipelineData, GHLSyncResponse } from "@/lib/ghl/types";

// Public report page — no auth required.
// The token in the URL IS the access control: a 32-char random hex string that
// is unguessable. Agencies share this URL once with their client — it always
// shows live data, so they never need to resend it.
//
// ?week=YYYY-MM-DD (Monday of the week) toggles between weekly and all-time views.
// Omitting the param defaults to all-time. Chevron links and "All time" button
// are plain anchor tags — zero client JS needed for navigation.
export const dynamic = "force-dynamic";

const SUMMARY_TTL_MS = 24 * 60 * 60 * 1000;

// ── Meta types ────────────────────────────────────────────────────────────────
// Declared locally — per codebase convention, types are not imported from route files.
// Note: account discovery logic is duplicated from /api/meta/campaigns.
// When a third server-side consumer appears, extract to lib/meta/accounts.ts.

const GRAPH           = "https://graph.facebook.com/v19.0";
const FOUNDER_BIZ_ID  = process.env.META_FOUNDER_BUSINESS_ID ?? "";
const FOUNDER_ACCT_ID = process.env.META_FOUNDER_ACCOUNT_ID  ?? "";

type InsightAction = { action_type: string; value: string };
type CampaignRow   = {
  campaign_name: string;
  spend?:        string;
  actions?:      InsightAction[];
  action_values?: InsightAction[];
};

type MetaCampaign = {
  name: string; spend: number; leads: number; revenue: number; cpl: number; roas: number;
};

type MetaReportData = {
  campaigns:    MetaCampaign[];
  totalLeads:   number;
  totalSpend:   number;
  totalRevenue: number;
};

// ── Week utilities ────────────────────────────────────────────────────────────

// Build an ISO date string from local date parts to avoid UTC-offset surprises
// when the server is in a different timezone from the client.
function toISODate(d: Date): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Returns the Monday of the ISO week containing `date`, at local midnight.
function getMondayOf(date: Date): Date {
  const d   = new Date(date);
  const dow = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  d.setHours(0, 0, 0, 0);
  return d;
}

// "Apr 7 – Apr 13, 2026"
function formatWeekLabel(mondayStr: string): string {
  const [y, m, day] = mondayStr.split("-").map(Number);
  const monday = new Date(y, m - 1, day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

function shiftWeek(mondayStr: string, dir: "prev" | "next"): string {
  const [y, m, d] = mondayStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + (dir === "next" ? 7 : -7));
  return toISODate(date);
}

// Guard against malformed ?week= values (e.g. manual URL edits).
// Accepts only YYYY-MM-DD that parses to a Monday.
function isValidWeekParam(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return !isNaN(date.getTime()) && date.getDay() === 1;
}

// ── Meta server-side fetch ────────────────────────────────────────────────────
// Fetches Meta campaign data using the org's stored OAuth token — no user
// session required. The public report page has admin DB access via report token.
// dateRange = undefined → all-time (date_preset=maximum); defined → weekly filter.

function sumActions(actions: InsightAction[] | undefined, type: string): number {
  const match = actions?.find((a) => a.action_type === type);
  return match ? parseFloat(match.value) : 0;
}

async function fetchMetaReportData(
  orgId: string,
  dateRange?: GHLDateRange,
): Promise<MetaReportData | null> {
  const admin = createAdminClient();
  const { data: integration } = await admin
    .from("integrations")
    .select("access_token")
    .eq("org_id", orgId)
    .eq("provider", "facebook")
    .eq("status", "active")
    .single();

  if (!integration) return null;

  const token      = integration.access_token;
  const dateParams = dateRange
    ? `&time_range=${encodeURIComponent(JSON.stringify({ since: dateRange.from, until: dateRange.to }))}`
    : `&date_preset=maximum`;

  try {
    // Discover ad accounts — same pattern as /api/meta/campaigns.
    // System user tokens may need the business/direct fallbacks; standard OAuth tokens use /me.
    const accountReqs: Promise<Response>[] = [
      fetch(`${GRAPH}/me/adaccounts?fields=id,account_status&access_token=${token}`),
    ];
    if (FOUNDER_BIZ_ID)
      accountReqs.push(fetch(`${GRAPH}/${FOUNDER_BIZ_ID}/owned_ad_accounts?fields=id,account_status&access_token=${token}`));
    if (FOUNDER_ACCT_ID)
      accountReqs.push(fetch(`${GRAPH}/${FOUNDER_ACCT_ID}?fields=id,account_status&access_token=${token}`));

    const accountResps = await Promise.all(accountReqs);
    const [me, biz, direct] = await Promise.all(
      accountResps.map((r) => r.json() as Promise<{
        data?: Array<{ id: string; account_status: number }>;
        id?: string; account_status?: number; error?: unknown;
      }>)
    );

    type AdAcct = { id: string; account_status: number };
    const allAccounts: AdAcct[] = [
      ...(me.data ?? []),
      ...(biz?.data ?? []),
      ...(direct && !direct.error && direct.id
        ? [{ id: direct.id, account_status: direct.account_status ?? 0 }]
        : []),
    ];

    const seen = new Set<string>();
    const active = allAccounts.filter((a) => {
      if (seen.has(a.id) || a.account_status !== 1) return false;
      seen.add(a.id);
      return true;
    });

    const insightRows = (
      await Promise.all(
        active.map(async (a) => {
          const r = await fetch(
            `${GRAPH}/${a.id}/insights` +
            `?level=campaign&fields=campaign_name,spend,actions,action_values&limit=50` +
            dateParams +
            `&access_token=${token}`,
          );
          const json = await r.json() as { data?: CampaignRow[] };
          return json.data ?? [];
        }),
      )
    ).flat();

    const agg = new Map<string, MetaCampaign>();
    for (const row of insightRows) {
      const name    = row.campaign_name;
      const spend   = parseFloat(row.spend ?? "0");
      const leads   =
        sumActions(row.actions,       "lead_generation") ||
        sumActions(row.actions,       "lead")             ||
        sumActions(row.actions,       "onsite_conversion.lead_grouped");
      const revenue =
        sumActions(row.action_values, "purchase")   ||
        sumActions(row.action_values, "omni_purchase");

      const ex = agg.get(name);
      if (ex) {
        ex.spend += spend; ex.leads += leads; ex.revenue += revenue;
        ex.cpl  = ex.leads > 0 ? ex.spend   / ex.leads : 0;
        ex.roas = ex.spend > 0 ? ex.revenue / ex.spend : 0;
      } else {
        agg.set(name, {
          name, spend, leads, revenue,
          cpl:  leads > 0 ? spend   / leads : 0,
          roas: spend > 0 ? revenue / spend : 0,
        });
      }
    }

    const campaigns = [...agg.values()].sort((a, b) => b.leads - a.leads).slice(0, 10);
    return {
      campaigns,
      totalLeads:   campaigns.reduce((s, c) => s + c.leads,   0),
      totalSpend:   campaigns.reduce((s, c) => s + c.spend,   0),
      totalRevenue: campaigns.reduce((s, c) => s + c.revenue, 0),
    };
  } catch {
    return null;
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  if (n >= 10_000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
function fmtCPL (n: number): string { return n > 0 ? `$${n.toFixed(2)}`  : "—"; }
function fmtROAS(n: number): string { return n > 0 ? `${n.toFixed(2)}x`  : "—"; }

// ── Subcomponents ─────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[#a3a3a3] text-xs">Live</span>
    </span>
  );
}

// Week selector — server-rendered anchor links, zero client JS.
// Only renders in weekly mode (currentWeek !== null); returns null in all-time mode.
// The "All time" toggle lives in the page header instead (see below).
// Chevrons are 36×36px for comfortable mobile tap targets.
// The date uses flex-1 + text-center so it sits perfectly centered between the two chevrons.
function WeekNav({ currentWeek, token }: { currentWeek: string | null; token: string }) {
  // All-time mode — no date row to show; the header handles the toggle
  if (!currentWeek) return null;

  const base        = `/report/${token}`;
  const todayMonday = toISODate(getMondayOf(new Date()));
  const prevWeek    = shiftWeek(currentWeek, "prev");
  const nextWeek    = shiftWeek(currentWeek, "next");
  const canGoNext   = nextWeek <= todayMonday;

  const LEFT  = "M7.5 9L4.5 6L7.5 3";
  const RIGHT = "M4.5 9L7.5 6L4.5 3";
  const chevronBase = "w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-[#e5e5e5] transition-colors";

  return (
    <div className="flex items-center mb-6">
      {/* Prev — always enabled */}
      <a
        href={`${base}?week=${prevWeek}`}
        aria-label="Previous week"
        className={cn(chevronBase, "hover:bg-[#f5f5f5]")}
      >
        <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
          <path d={LEFT} stroke="#525252" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>

      {/* flex-1 + text-center perfectly centers the label between the two fixed-width chevrons */}
      <span className="flex-1 text-center text-xl font-bold text-[#0a0a0a] px-3">
        {formatWeekLabel(currentWeek)}
      </span>

      {/* Next — dimmed when already at the current week */}
      {canGoNext ? (
        <a
          href={`${base}?week=${nextWeek}`}
          aria-label="Next week"
          className={cn(chevronBase, "hover:bg-[#f5f5f5]")}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
            <path d={RIGHT} stroke="#525252" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      ) : (
        <span className={cn(chevronBase, "opacity-20 cursor-not-allowed")} aria-disabled="true">
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
            <path d={RIGHT} stroke="#525252" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </div>
  );
}

// Ad performance summary — total leads, spend, CPL, ROAS for the period.
// meta === null means the Meta integration isn't connected; show a dashed placeholder.
// ROAS shows "—" when revenue isn't tracked in Meta (common for med spas without pixel purchase events).
function MetaSummaryBar({ meta }: { meta: MetaReportData | null }) {
  if (!meta) {
    return (
      <div className="rounded-xl border border-dashed border-[#d4d4d4] bg-[#fafafa] px-5 py-4 mb-8">
        <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-1">Ad Performance</p>
        <p className="text-sm text-[#a3a3a3]">
          Meta Ads not yet connected — campaign metrics will appear here.
        </p>
      </div>
    );
  }

  const { totalLeads, totalSpend, totalRevenue } = meta;
  const cpl  = totalLeads > 0 ? totalSpend   / totalLeads : 0;
  const roas = totalSpend  > 0 ? totalRevenue / totalSpend : 0;

  const stats = [
    { label: "Leads", value: totalLeads > 0 ? totalLeads.toLocaleString() : "—" },
    { label: "Spend", value: totalSpend  > 0 ? fmtMoney(totalSpend)        : "—" },
    { label: "CPL",   value: fmtCPL(cpl)  },
    { label: "ROAS",  value: fmtROAS(roas) },
  ];

  return (
    <div className="rounded-xl border border-[#e5e5e5] overflow-hidden mb-8">
      <div className="grid grid-cols-4 divide-x divide-[#e5e5e5]">
        {stats.map((s) => (
          <div key={s.label} className="p-4 text-center">
            <p className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-xl font-bold tracking-tight ${s.value === "—" ? "text-[#d4d4d4]" : "text-[#0a0a0a]"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Campaign breakdown table — sorted by leads descending.
// Horizontally scrollable on narrow phones to keep column widths readable.
// Two distinct empty states: "not connected" vs "no data for this period".
function CampaignsTable({ meta }: { meta: MetaReportData | null }) {
  const emptyMsg = !meta
    ? "Connect Meta Ads to see campaign performance."
    : "No campaign data for this period.";

  return (
    <div className="mb-8">
      <p className="text-base font-semibold text-[#0a0a0a] mb-4">Campaigns</p>

      {!meta || meta.campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d4d4d4] bg-[#fafafa] px-5 py-5">
          <p className="text-sm text-[#a3a3a3]">{emptyMsg}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#e5e5e5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] border-collapse text-left">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e5e5e5]">
                  {(["Campaign", "Spend", "Leads", "CPL", "ROAS"] as const).map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wide whitespace-nowrap ${h !== "Campaign" ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meta.campaigns.map((c, i) => (
                  <tr
                    key={c.name}
                    className={i < meta.campaigns.length - 1 ? "border-b border-[#f0f0f0]" : ""}
                  >
                    {/* Campaign name truncates — full name visible on hover/long-press via title */}
                    <td className="px-4 py-3 max-w-[160px]">
                      <span className="block text-sm text-[#0a0a0a] truncate" title={c.name}>
                        {c.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#525252] text-right tabular-nums whitespace-nowrap">
                      {c.spend > 0 ? fmtMoney(c.spend) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#0a0a0a] text-right tabular-nums">
                      {c.leads > 0 ? c.leads.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#525252] text-right tabular-nums whitespace-nowrap">
                      {fmtCPL(c.cpl)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {c.roas > 0 ? (
                        // Highlight ROAS ≥ 2x in green — a common benchmark for profitable ad spend
                        <span className={`text-sm font-medium ${c.roas >= 2 ? "text-emerald-600" : "text-[#525252]"}`}>
                          {fmtROAS(c.roas)}
                        </span>
                      ) : (
                        <span className="text-sm text-[#d4d4d4]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact funnel display — purpose-built for the narrow mobile card design.
// The dashboard FunnelSnapshot uses a horizontal layout; this is vertical-friendly.
function ReportFunnel({ data }: { data: GHLSyncResponse }) {
  function convPct(from: number, to: number): string | null {
    if (from === 0) return null;
    return `${Math.round((to / from) * 100)}%`;
  }

  function fmtCount(n: number): string {
    return n > 0 ? n.toLocaleString() : "—";
  }

  const stages = [
    { label: "Leads",  value: data.contacts   },
    { label: "Booked", value: data.bookedCount },
    { label: "Showed", value: data.showedCount },
    { label: "Paid",   value: data.wonCount    },
  ];

  const conversions = [
    convPct(data.contacts,   data.bookedCount),
    convPct(data.bookedCount, data.showedCount),
    convPct(data.showedCount, data.wonCount),
  ];

  const convLabels = ["Booking rate", "Show rate", "Close rate"];

  return (
    <div className="rounded-xl border border-[#e5e5e5] overflow-hidden">
      {/* Stage counts */}
      <div className="grid grid-cols-4 divide-x divide-[#e5e5e5]">
        {stages.map((s) => (
          <div key={s.label} className="p-4 text-center">
            <p className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide mb-1">
              {s.label}
            </p>
            <p className={`text-2xl font-bold tracking-tight ${s.value > 0 ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
              {fmtCount(s.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Conversion rates between stages */}
      <div className="grid grid-cols-3 divide-x divide-[#e5e5e5] border-t border-[#f0f0f0] bg-[#fafafa]">
        {conversions.map((rate, i) => (
          <div key={i} className="px-3 py-2 text-center">
            <p className={`text-sm font-semibold ${rate ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
              {rate ?? "—"}
            </p>
            <p className="text-[10px] text-[#a3a3a3]">{convLabels[i]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelRow({ pipeline, rank }: { pipeline: GHLPipelineData; rank: number }) {
  const totalLeads = pipeline.stages[0]?.count ?? 0;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-[#f0f0f0] last:border-0">
      {/* Rank badge */}
      <div className="w-6 h-6 rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[11px] font-semibold text-[#a3a3a3]">{rank}</span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0a0a0a] truncate">{pipeline.pipelineName}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {pipeline.closeRate !== null && (
            <span className="text-xs text-[#525252]">
              <span className="font-semibold text-[#0a0a0a]">{pipeline.closeRate}%</span> close rate
            </span>
          )}
          {totalLeads > 0 && (
            <span className="text-xs text-[#a3a3a3]">{totalLeads} leads</span>
          )}
          {pipeline.wonRevenue > 0 && (
            <span className="text-xs text-[#a3a3a3]">${pipeline.wonRevenue.toLocaleString()} revenue</span>
          )}
        </div>

        {/* Mini funnel bar — each segment represents a stage, fading with position */}
        {pipeline.stages.length > 0 && totalLeads > 0 && (
          <div className="flex gap-0.5 mt-2">
            {pipeline.stages.map((stage, i) => {
              const pct = Math.round((stage.count / totalLeads) * 100);
              return (
                <div
                  key={i}
                  title={`${stage.name}: ${stage.count}`}
                  className="h-1 rounded-full bg-[#0a0a0a]"
                  style={{
                    width: `${Math.max(pct, 4)}%`,
                    opacity: 1 - i * (0.6 / pipeline.stages.length),
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Close rate callout */}
      {pipeline.closeRate !== null && (
        <div className="shrink-0 text-right">
          <span className="text-2xl font-bold text-[#0a0a0a]">{pipeline.closeRate}%</span>
        </div>
      )}
    </div>
  );
}

// Renders AI-generated summary sections — each with a bold heading and body copy.
// Falls back to a muted placeholder when the summary isn't available (no API key,
// generation failed, etc.) so the report page never hard-errors.
// Shown in both all-time and weekly views. All-time is cached 24h; weekly is live.
function AISummary({ sections }: { sections: SummarySection[] | null }) {
  const icon = (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.37 9.37l1.41 1.41M3.22 10.78l1.41-1.41M9.37 4.63l1.41-1.41"
        strokeWidth="1.2" strokeLinecap="round"
        stroke={sections && sections.length > 0 ? "#0a0a0a" : "#a3a3a3"}
      />
    </svg>
  );

  if (!sections || sections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d4d4d4] bg-[#fafafa] px-5 py-5">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wide">AI Insights</span>
        </div>
        <p className="text-sm text-[#a3a3a3] leading-relaxed">
          Intelligent campaign analysis is coming soon — key trends, what&apos;s working,
          and what to watch, written in plain English.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-5 py-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wide">AI Insights</span>
      </div>
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i}>
            <p className="text-sm font-semibold text-[#0a0a0a] mb-0.5">{section.heading}</p>
            <p className="text-sm text-[#525252] leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ad Performance — Meta-sourced CPL + total leads stat tiles, then a ranked list
// of top campaigns by CPL. Campaigns sorted by leads desc (already in that order
// from fetchMetaReportData) so the list shows highest-volume campaigns, not just
// cheapest ones. CPL highlighted green when it beats the overall average.
function AdPerformanceSection({ meta }: { meta: MetaReportData | null }) {
  if (!meta || (meta.totalLeads === 0 && meta.totalSpend === 0)) {
    return (
      <div className="rounded-xl border border-dashed border-[#d4d4d4] bg-[#fafafa] px-5 py-4">
        <p className="text-sm text-[#a3a3a3]">Connect Meta Ads to see ad performance metrics.</p>
      </div>
    );
  }

  const avgCpl = meta.totalLeads > 0 ? meta.totalSpend / meta.totalLeads : 0;
  // Only show campaigns that generated leads — CPL is undefined without lead data
  const topAds = meta.campaigns.filter((c) => c.leads > 0).slice(0, 5);

  return (
    <>
      {/* Two hero stat tiles — the two numbers clients care about most */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-[#e5e5e5] p-4">
          <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-2">Cost Per Lead</p>
          <p className={`text-2xl font-bold tracking-tight ${avgCpl > 0 ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
            {fmtCPL(avgCpl)}
          </p>
        </div>
        <div className="rounded-xl border border-[#e5e5e5] p-4">
          <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-2">Total Leads</p>
          <p className={`text-2xl font-bold tracking-tight ${meta.totalLeads > 0 ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
            {meta.totalLeads > 0 ? meta.totalLeads.toLocaleString() : "—"}
          </p>
        </div>
      </div>

      {/* Top campaigns by lead volume, with individual CPL.
          Green CPL = better than the account average. */}
      {topAds.length > 0 && (
        <div className="rounded-xl border border-[#e5e5e5] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e5e5e5]">
            <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wide">Top Campaigns</p>
          </div>
          {topAds.map((c, i) => (
            <div
              key={c.name}
              className={`flex items-center justify-between px-4 py-3 ${i < topAds.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}
            >
              <span className="text-sm text-[#0a0a0a] truncate mr-4" style={{ maxWidth: "65%" }} title={c.name}>
                {c.name}
              </span>
              {/* Green when this campaign beats the account average CPL */}
              <span className={`text-sm font-semibold tabular-nums whitespace-nowrap ${avgCpl > 0 && c.cpl < avgCpl ? "text-emerald-600" : "text-[#0a0a0a]"}`}>
                {fmtCPL(c.cpl)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Lead Handling Performance — funnel conversion rates from GHL data.
// Shows how well leads are being worked: booking rate, show rate, close rate.
// These rates answer "once a lead comes in, what happens to it?" which is the
// agency's responsibility, distinct from ad-side CPL and volume.
function LeadHandlingSection({ data }: { data: GHLSyncResponse }) {
  function convPct(from: number, to: number): string {
    if (from === 0) return "—";
    return `${Math.round((to / from) * 100)}%`;
  }

  const stats = [
    { label: "Booking Rate", value: convPct(data.contacts, data.bookedCount) },
    { label: "Show Rate",    value: convPct(data.bookedCount, data.showedCount) },
    { label: "Close Rate",   value: convPct(data.showedCount, data.wonCount) },
  ];

  return (
    <div className="rounded-xl border border-[#e5e5e5] overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-[#e5e5e5]">
        {stats.map((s) => (
          <div key={s.label} className="p-4 text-center">
            <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-bold tracking-tight ${s.value === "—" ? "text-[#d4d4d4]" : "text-[#0a0a0a]"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Appointment Performance — aggregate stats derived from the appointment confirmation
// list (last 30 days of GHL calendar appointments merged with our DB confirmations).
// "Booked" = every appointment fetched; "Showed"/"No-show" = confirmed outcomes;
// "Pending" = not yet confirmed. Show rate calculated only over confirmed appointments
// so partial confirmation doesn't drag the rate down misleadingly.
function AppointmentPerformanceSection({ appointments }: { appointments: AppointmentItem[] }) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d4d4d4] bg-[#fafafa] px-5 py-4">
        <p className="text-sm text-[#a3a3a3]">No appointment data available for this period.</p>
      </div>
    );
  }

  const showed  = appointments.filter((a) => a.outcome === "showed").length;
  const noShow  = appointments.filter((a) => a.outcome === "no_show").length;
  const pending = appointments.filter((a) => a.outcome === null).length;
  const confirmed = showed + noShow;
  // Show rate over confirmed-only; pending appointments aren't resolved yet
  const showRatePct = confirmed > 0 ? Math.round((showed / confirmed) * 100) : null;

  const stats = [
    { label: "Booked",   value: appointments.length.toString() },
    { label: "Showed",   value: showed.toString() },
    { label: "No-shows", value: noShow.toString() },
    { label: "Pending",  value: pending.toString() },
  ];

  return (
    <>
      <div className="rounded-xl border border-[#e5e5e5] overflow-hidden mb-3">
        <div className="grid grid-cols-4 divide-x divide-[#e5e5e5]">
          {stats.map((s) => (
            <div key={s.label} className="p-4 text-center">
              <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-2">{s.label}</p>
              <p className={`text-2xl font-bold tracking-tight ${s.value === "0" ? "text-[#d4d4d4]" : "text-[#0a0a0a]"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Show rate summary — only rendered once at least one appointment is confirmed */}
      {showRatePct !== null && (
        <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-4 py-3 flex items-center gap-3">
          <span className="text-lg font-bold text-[#0a0a0a]">{showRatePct}%</span>
          <span className="text-sm text-[#525252]">
            show rate ({showed} of {confirmed} confirmed appointments)
          </span>
        </div>
      )}
    </>
  );
}

// Section heading with an optional period label in muted text.
// Used to clarify which sections are date-filtered vs always all-time.
function SectionHeading({
  label,
  sub,
  period,
}: {
  label: string;
  sub?: string;
  period?: string;
}) {
  return (
    <div className="flex items-baseline gap-2 mb-4">
      <p className="text-base font-semibold text-[#0a0a0a]">{label}</p>
      {period && (
        <span className="text-[10px] text-[#d4d4d4]">{period}</span>
      )}
      {sub && !period && (
        <span className="text-[10px] text-[#d4d4d4]">{sub}</span>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReportPage({
  params,
  searchParams,
}: {
  params:       Promise<{ token: string }>;
  // searchParams is a Promise in Next.js 16 — must be awaited before reading keys.
  searchParams: Promise<{ week?: string }>;
}) {
  const { token } = await params;
  const { week }  = await searchParams;
  const admin     = createAdminClient();

  // Validate and parse the ?week= param. Invalid or missing → all-time mode.
  const currentWeek = week && isValidWeekParam(week) ? week : null;

  // Build a date range from the Monday YYYY-MM-DD param (Mon 00:00 → Sun 23:59 local).
  let dateRange: GHLDateRange | undefined;
  if (currentWeek) {
    const [y, m, d] = currentWeek.split("-").map(Number);
    const monday = new Date(y, m - 1, d);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    dateRange = { from: toISODate(monday), to: toISODate(sunday) };
  }

  // Look up the report by token — 404 if the token is invalid or not found.
  // We also select the AI summary cache columns so we can avoid re-generating
  // within the 24h TTL.
  const { data: report } = await admin
    .from("reports")
    .select("org_id, agency_name, location_id, location_name, ai_summary, summary_generated_at")
    .eq("token", token)
    .single();

  if (!report) notFound();

  // Resolve the best available token for this location.
  // Sub-account token (if connected) has calendars.readonly for appointment fetching.
  // Falls back to company token for contacts + opportunities data.
  let ghlToken: string;
  try {
    const locationToken = await getValidLocationToken(report.org_id, report.location_id);
    ghlToken = locationToken ?? await getValidGHLToken(report.org_id);
  } catch {
    ghlToken = "";
  }

  // Fetch GHL and Meta data in parallel — independent external fetches, no ordering dependency.
  let data: GHLSyncResponse | null = null;
  let dataError = false;
  let metaData: MetaReportData | null = null;

  const [ghlSettled, metaSettled] = await Promise.allSettled([
    ghlToken
      ? fetchLocationData(report.location_id, ghlToken, dateRange)
      : Promise.reject(new Error("no GHL token")),
    fetchMetaReportData(report.org_id, dateRange),
  ]);

  if (ghlSettled.status === "fulfilled") {
    data = ghlSettled.value;
  } else {
    dataError = true;
  }
  metaData = metaSettled.status === "fulfilled" ? metaSettled.value : null;

  // ── Showed count from appointment_confirmations ────────────────────────────
  // Patch the showed count into the GHL data object. The table may not exist
  // yet (requires SQL migration) — Supabase returns an error row, not a throw.
  if (data) {
    try {
      const { count: showedCount } = await admin
        .from("appointment_confirmations")
        .select("*", { count: "exact", head: true })
        .eq("org_id", report.org_id)
        .eq("location_id", report.location_id)
        .eq("outcome", "showed");

      data = { ...data, showedCount: showedCount ?? 0 };
    } catch {
      // Table doesn't exist yet — showed stays 0
    }
  }

  // ── Appointment list for show/no-show confirmation UI ─────────────────────
  // Fetches the last 30 days of appointments from GHL, then merges with any
  // existing confirmations from our DB so the UI shows the current state.
  let appointmentItems: AppointmentItem[] = [];

  if (ghlToken) {
    try {
      const { appointments } = await fetchAppointments(report.location_id, ghlToken);

      // Fetch existing confirmations so the UI can show confirmed state on load
      const { data: existingConfirmations } = await admin
        .from("appointment_confirmations")
        .select("ghl_appointment_id, outcome")
        .eq("org_id", report.org_id)
        .eq("location_id", report.location_id);

      const confirmationMap = new Map(
        (existingConfirmations ?? []).map((c) => [c.ghl_appointment_id, c.outcome as "showed" | "no_show"])
      );

      // Convert GHL appointment objects to the shape AppointmentConfirmList expects.
      // Sort by appointment time descending so the most recent appear first.
      appointmentItems = appointments
        .map((appt) => ({
          id:            appt.id,
          contactName:   getAppointmentContactName(appt),
          appointmentAt: getAppointmentDate(appt).toISOString(),
          outcome:       confirmationMap.get(appt.id) ?? null,
        }))
        .sort((a, b) => new Date(b.appointmentAt).getTime() - new Date(a.appointmentAt).getTime());
    } catch {
      // Appointments unavailable — omit the confirmation section
    }
  }

  // ── AI summary ────────────────────────────────────────────────────────────
  // Generated for both all-time and weekly views.
  // All-time: cached 24h in the reports table — serves instantly on repeat visits.
  // Weekly: generated fresh on each visit, not cached — weekly data is scoped and
  //   changes as confirmations come in, so a 24h cache would often be stale anyway.
  //   We avoid storing it in the reports table to prevent overwriting the all-time cache.
  // Skip entirely when ANTHROPIC_API_KEY isn't set (local dev / staging without key).
  let summarySections: SummarySection[] | null = null;

  if (data && process.env.ANTHROPIC_API_KEY) {
    if (!dateRange) {
      // ── All-time: serve from cache if fresh, otherwise generate + cache ──
      const generatedAt = report.summary_generated_at
        ? new Date(report.summary_generated_at).getTime()
        : 0;
      const isFresh = report.ai_summary && Date.now() - generatedAt < SUMMARY_TTL_MS;

      if (isFresh) {
        try {
          summarySections = JSON.parse(report.ai_summary) as SummarySection[];
        } catch {
          // Corrupt cache — fall through to regenerate below
        }
      }

      if (!summarySections) {
        try {
          summarySections = await generateReportSummary(data, report.location_name ?? "Client");
          // Cache the summary after the response is sent — after() guarantees
          // this runs on serverless without blocking the client or risking
          // termination before an unawaited promise resolves.
          after(async () => {
            try {
              await admin
                .from("reports")
                .update({
                  ai_summary:           JSON.stringify(summarySections),
                  summary_generated_at: new Date().toISOString(),
                })
                .eq("token", token);
            } catch {
              // Cache write failure is non-fatal — next visit will regenerate
            }
          });
        } catch (err) {
          console.error("[report] summary failed:", err);
        }
      }
    } else {
      // ── Weekly: generate fresh, no caching ────────────────────────────────
      // weekLabel is the Mon YYYY-MM-DD string already validated above.
      try {
        summarySections = await generateReportSummary(
          data,
          report.location_name ?? "Client",
          currentWeek ?? undefined,
        );
      } catch (err) {
        console.error("[report] weekly summary failed:", err);
      }
    }
  }

  const monthYear   = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayMonday = toISODate(getMondayOf(new Date()));
  const base        = `/report/${token}`;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 py-8 pb-16">

        {/* Header — location info on the left, period toggle on the right.
            In weekly mode: "All time" outline button (shadcn) navigates back to base URL.
            In all-time mode: subtle "This week →" text link navigates to current week. */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-widest mb-1">
                {report.agency_name || "Agency Report"}
              </p>
              <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight leading-tight">
                {report.location_name || "Client Report"}
              </h1>
            </div>
            {currentWeek ? (
              <a
                href={base}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 mt-1")}
              >
                All time
              </a>
            ) : (
              <a
                href={`${base}?week=${todayMonday}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 mt-1")}
              >
                This week →
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-[#a3a3a3]">{monthYear}</span>
            <LiveDot />
          </div>
        </div>

        {/* Week selector — only renders in weekly mode (null in all-time mode) */}
        <WeekNav currentWeek={currentWeek} token={token} />

        {/* AI Insights — at the top so clients see the narrative summary first before
            diving into raw numbers. All-time cached 24h; weekly generated fresh. */}
        {data && (
          <div className="mb-8">
            <AISummary sections={summarySections} />
          </div>
        )}

        {/* Appointment Updates — placed directly below AI Insights so the med spa
            owner can act on confirmations immediately after reading the summary. */}
        {appointmentItems.length > 0 && (
          <div className="mb-8">
            <SectionHeading label="Appointment Updates" />
            <div className="rounded-xl border border-[#e5e5e5] px-4">
              <AppointmentConfirmList
                appointments={appointmentItems}
                reportToken={token}
              />
            </div>
          </div>
        )}

        {/* Ad performance summary bar — leads, spend, CPL, ROAS for the selected period */}
        <MetaSummaryBar meta={metaData} />

        {dataError ? (
          <div className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] px-5 py-4 text-sm text-[#ef4444] mb-8">
            Unable to load report data at this time. Please check back shortly.
          </div>
        ) : data ? (
          <>
            {/* Funnel overview — date-filtered in weekly mode.
                Heading is intentionally larger than other section labels so it reads
                as the primary data section on the page. Period label omitted — the
                WeekNav at the top already communicates the selected timeframe. */}
            <div className="mb-8">
              <h2 className="text-base font-semibold text-[#0a0a0a] mb-4">Funnel Overview</h2>
              <ReportFunnel data={data} />
            </div>

            {/* Campaign breakdown — date-filtered in weekly mode */}
            <CampaignsTable meta={metaData} />

            {/* Pipeline leaderboard — always all-time; week label would be misleading here */}
            {data.pipelines.length > 0 && (
              <div className="mb-8">
                <SectionHeading
                  label="Funnel Performance"
                  period={currentWeek ? "All time" : undefined}
                />
                <div className="rounded-xl border border-[#e5e5e5] overflow-hidden px-4">
                  {data.pipelines.map((pl, i) => (
                    <FunnelRow key={pl.pipelineName} pipeline={pl} rank={i + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Ad Performance — Meta CPL, total leads, and top campaigns by CPL.
                Shows the agency's ad buying efficiency for the selected period. */}
            <div className="mb-8">
              <SectionHeading label="Ad Performance" />
              <AdPerformanceSection meta={metaData} />
            </div>

            {/* Lead Handling Performance — funnel conversion rates from GHL.
                Shows what happens to leads after they come in: booking, show, close. */}
            <div className="mb-8">
              <SectionHeading label="Lead Handling Performance" />
              <LeadHandlingSection data={data} />
            </div>

            {/* Appointment Performance — aggregate stats from the last 30 days of
                calendar appointments, broken down by confirmation outcome. */}
            <div className="mb-8">
              <SectionHeading label="Appointment Performance" />
              <AppointmentPerformanceSection appointments={appointmentItems} />
            </div>
          </>
        ) : null}

        {/* Footer */}
        <div className="pt-8 border-t border-[#f0f0f0] flex items-center justify-between">
          <p className="text-[11px] text-[#d4d4d4]">
            Powered by{" "}
            <a href="https://sourceiq.app" className="hover:text-[#a3a3a3] transition-colors">
              SourceIQ
            </a>
          </p>
          <p className="text-[11px] text-[#d4d4d4]">Data updates on every visit</p>
        </div>

      </div>
    </div>
  );
}
