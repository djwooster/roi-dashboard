import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";
import type { GHLPipelineData } from "@/app/api/ghl/sync/route";

// Public report page — no auth required.
// The token in the URL IS the access control: a 32-char random hex string
// that is unguessable. Agencies share this URL with their clients.
//
// Data is fetched live on every page view so the report is always current.
// Agencies share the link once — it auto-updates month after month.
export const dynamic = "force-dynamic";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

type GHLOpportunity = { monetaryValue?: number };
type GHLListResponse<T> = {
  meta?: { total?: number };
  opportunities?: T[];
  contacts?: T[];
};

async function ghlFetch(path: string, token: string) {
  return fetch(`${GHL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION },
  });
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[#a3a3a3] text-xs">Live</span>
    </span>
  );
}

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wide">{label}</span>
      <span className="text-3xl font-bold text-[#0a0a0a] tracking-tight">{value}</span>
      {sub && <span className="text-[11px] text-[#c4c4c4]">{sub}</span>}
    </div>
  );
}

function FunnelRow({ pipeline, rank }: { pipeline: GHLPipelineData; rank: number }) {
  const totalLeads = pipeline.stages[0]?.count ?? 0;
  const revenue = pipeline.wonRevenue;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-[#f0f0f0] last:border-0">
      {/* Rank badge */}
      <div className="w-6 h-6 rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[11px] font-semibold text-[#a3a3a3]">{rank}</span>
      </div>

      {/* Content */}
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
          {revenue > 0 && (
            <span className="text-xs text-[#a3a3a3]">${revenue.toLocaleString()} revenue</span>
          )}
        </div>

        {/* Mini stage bar */}
        {pipeline.stages.length > 0 && totalLeads > 0 && (
          <div className="flex gap-0.5 mt-2">
            {pipeline.stages.map((stage, i) => {
              const pct = Math.round((stage.count / totalLeads) * 100);
              return (
                <div
                  key={i}
                  title={`${stage.name}: ${stage.count}`}
                  className="h-1 rounded-full bg-[#0a0a0a]"
                  style={{ width: `${Math.max(pct, 4)}%`, opacity: 1 - i * (0.6 / pipeline.stages.length) }}
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

function AISummaryPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-[#e5e5e5] bg-[#fafafa] px-5 py-5">
      <div className="flex items-center gap-2 mb-2">
        {/* Sparkle icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.37 9.37l1.41 1.41M3.22 10.78l1.41-1.41M9.37 4.63l1.41-1.41" stroke="#c4c4c4" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-xs font-semibold text-[#c4c4c4] uppercase tracking-wide">AI Insights</span>
      </div>
      <p className="text-sm text-[#c4c4c4] leading-relaxed">
        Intelligent campaign analysis is coming soon — key trends, what&apos;s working, and what to watch, written in plain English.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  // Look up the report by token — 404 if not found or token is invalid
  const { data: report } = await admin
    .from("reports")
    .select("org_id, agency_name, location_id, location_name")
    .eq("token", token)
    .single();

  if (!report) notFound();

  // Fetch live GHL data — same logic as the sync route but scoped to this report's org
  let contacts = 0;
  let opportunities = 0;
  let closedRevenue = 0;
  let closeRate: number | null = null;
  let avgDealValue: number | null = null;
  let pipelines: GHLPipelineData[] = [];
  let dataError = false;

  try {
    const ghlToken = await getValidGHLToken(report.org_id);
    const locationId = report.location_id;

    const [contactsRes, oppsRes, wonRes] = await Promise.all([
      ghlFetch(`/contacts/?locationId=${locationId}&limit=1`, ghlToken),
      ghlFetch(`/opportunities/search?location_id=${locationId}&limit=1`, ghlToken),
      ghlFetch(`/opportunities/search?location_id=${locationId}&status=won&limit=100`, ghlToken),
    ]);

    const [contactsData, oppsData, wonData] = await Promise.all([
      contactsRes.ok ? contactsRes.json() as Promise<GHLListResponse<{ id: string }>> : Promise.resolve({} as GHLListResponse<{ id: string }>),
      oppsRes.ok ? oppsRes.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve({} as GHLListResponse<GHLOpportunity>),
      wonRes.ok ? wonRes.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve({} as GHLListResponse<GHLOpportunity>),
    ]);

    contacts = contactsData.meta?.total ?? 0;
    opportunities = oppsData.meta?.total ?? 0;
    const wonOpps = wonData.opportunities ?? [];
    const wonCount = wonData.meta?.total ?? wonOpps.length;
    closedRevenue = wonOpps.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0);

    // Fetch per-pipeline data
    try {
      const pipelinesRes = await ghlFetch(`/pipelines/?locationId=${locationId}`, ghlToken);
      if (pipelinesRes.ok) {
        const pipelinesData = await pipelinesRes.json() as { pipelines?: { id: string; name: string; stages: { id: string; name: string; position: number }[] }[] };
        const allPipelines = pipelinesData.pipelines ?? [];

        pipelines = await Promise.all(
          allPipelines.map(async (pl) => {
            const sortedStages = [...pl.stages].sort((a, b) => a.position - b.position);
            const [stageResults, lostRes, plWonRes] = await Promise.all([
              Promise.all(
                sortedStages.map((stage) =>
                  ghlFetch(`/opportunities/search?location_id=${locationId}&pipeline_id=${pl.id}&pipeline_stage_id=${stage.id}&status=open&limit=1`, ghlToken)
                    .then((r) => r.ok ? r.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve({} as GHLListResponse<GHLOpportunity>))
                )
              ),
              ghlFetch(`/opportunities/search?location_id=${locationId}&pipeline_id=${pl.id}&status=lost&limit=1`, ghlToken)
                .then((r) => r.ok ? r.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve({} as GHLListResponse<GHLOpportunity>)),
              ghlFetch(`/opportunities/search?location_id=${locationId}&pipeline_id=${pl.id}&status=won&limit=100`, ghlToken)
                .then((r) => r.ok ? r.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve({} as GHLListResponse<GHLOpportunity>)),
            ]);

            const lostCount = (lostRes as GHLListResponse<GHLOpportunity>).meta?.total ?? 0;
            const plWonOpps = (plWonRes as GHLListResponse<GHLOpportunity>).opportunities ?? [];
            const plWonCount = (plWonRes as GHLListResponse<GHLOpportunity>).meta?.total ?? plWonOpps.length;
            const plWonRevenue = plWonOpps.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0);
            const plCloseRate = plWonCount + lostCount > 0 ? Math.round((plWonCount / (plWonCount + lostCount)) * 100) : null;
            const plAvgDeal = plWonCount > 0 ? Math.round(plWonRevenue / plWonCount) : null;

            return {
              pipelineName: pl.name,
              stages: sortedStages.map((stage, i) => ({
                name: stage.name,
                count: (stageResults[i] as GHLListResponse<GHLOpportunity>).meta?.total ?? 0,
              })),
              lostCount,
              wonCount: plWonCount,
              wonRevenue: plWonRevenue,
              closeRate: plCloseRate,
              avgDealValue: plAvgDeal,
            };
          })
        );

        // Sort by close rate descending for the leaderboard
        pipelines.sort((a, b) => (b.closeRate ?? -1) - (a.closeRate ?? -1));

        // Compute overall close rate from per-pipeline data
        const totalWon = pipelines.reduce((s, p) => s + p.wonCount, 0);
        const totalLost = pipelines.reduce((s, p) => s + p.lostCount, 0);
        closeRate = totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : null;
        avgDealValue = totalWon > 0 ? Math.round(closedRevenue / wonCount) : null;
      }
    } catch {
      // Pipeline fetch failed — basic KPIs still show
    }
  } catch {
    dataError = true;
  }

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 py-8 pb-16">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-widest mb-1">
            {report.agency_name || "Agency Report"}
          </p>
          <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight leading-tight">
            {report.location_name || "Client Report"}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-[#a3a3a3]">{monthYear}</span>
            <LiveDot />
          </div>
        </div>

        {/* AI Summary placeholder */}
        <div className="mb-8">
          <AISummaryPlaceholder />
        </div>

        {dataError ? (
          <div className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] px-5 py-4 text-sm text-[#ef4444]">
            Unable to load report data. Please check back shortly.
          </div>
        ) : (
          <>
            {/* KPI strip */}
            <div className="mb-8">
              <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-4">Performance Overview</p>
              <div className="grid grid-cols-2 gap-6">
                <KPICard label="Total Contacts" value={contacts.toLocaleString()} />
                <KPICard label="Open Opportunities" value={opportunities.toLocaleString()} />
                {closeRate !== null && (
                  <KPICard label="Close Rate" value={`${closeRate}%`} />
                )}
                {avgDealValue !== null && (
                  <KPICard label="Avg Deal Value" value={`$${avgDealValue.toLocaleString()}`} />
                )}
                {closedRevenue > 0 && (
                  <KPICard
                    label="Closed Revenue"
                    value={`$${closedRevenue >= 1000 ? `${(closedRevenue / 1000).toFixed(1)}K` : closedRevenue.toLocaleString()}`}
                  />
                )}
              </div>
            </div>

            {/* Funnel leaderboard */}
            {pipelines.length > 0 && (
              <div className="mb-8">
                <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-1">Funnel Performance</p>
                <p className="text-xs text-[#c4c4c4] mb-4">Ranked by close rate</p>
                <div className="rounded-xl border border-[#e5e5e5] overflow-hidden px-4">
                  {pipelines.map((pl, i) => (
                    <FunnelRow key={pl.pipelineName} pipeline={pl} rank={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

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
