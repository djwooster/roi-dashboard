import { ghlFetch } from "./api";
import type {
  GHLOpportunity,
  GHLListResponse,
  GHLPipelineData,
  GHLPipelinesResponse,
  GHLSyncResponse,
} from "./types";

// Fetches all KPI and pipeline data for a GHL location.
// Used by both the authenticated sync route (/api/ghl/sync) and the public
// report page (/report/[token]) — the only difference between those two callers
// is how they obtained the access token and location ID.
//
// Pipeline data is fetched in an isolated try/catch so a GHL API failure there
// doesn't wipe out the basic KPI numbers (contacts, opportunities, revenue).
export async function fetchLocationData(locationId: string, token: string): Promise<GHLSyncResponse> {
  const [contactsRes, oppsRes, wonRes] = await Promise.all([
    ghlFetch(`/contacts/?locationId=${locationId}&limit=1`, token),
    ghlFetch(`/opportunities/search?location_id=${locationId}&limit=1`, token),
    // Fetch won opps with full records so we can sum revenue.
    // limit=100 covers the vast majority of pipelines — pagination can be layered in later.
    ghlFetch(`/opportunities/search?location_id=${locationId}&status=won&limit=100`, token),
  ]);

  const empty = {} as GHLListResponse<GHLOpportunity>;
  const [contactsData, oppsData, wonData] = await Promise.all([
    contactsRes.ok ? contactsRes.json() as Promise<GHLListResponse<{ id: string }>> : Promise.resolve(empty),
    oppsRes.ok ? oppsRes.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve(empty),
    wonRes.ok ? wonRes.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve(empty),
  ]);

  const contacts = (contactsData as GHLListResponse<{ id: string }>).meta?.total ?? 0;
  const opportunities = oppsData.meta?.total ?? 0;
  const wonOpps = wonData.opportunities ?? [];
  const totalWonCount = wonData.meta?.total ?? wonOpps.length;
  const closedRevenue = wonOpps.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0);

  // Fetch per-pipeline data — in its own try/catch so basic KPIs always return
  let pipelines: GHLPipelineData[] = [];
  try {
    const pipelinesRes = await ghlFetch(`/pipelines/?locationId=${locationId}`, token);
    if (pipelinesRes.ok) {
      const pipelinesData = await pipelinesRes.json() as GHLPipelinesResponse;
      const allPipelines = pipelinesData.pipelines ?? [];

      pipelines = await Promise.all(
        allPipelines.map(async (pl) => {
          const sortedStages = [...pl.stages].sort((a, b) => a.position - b.position);

          const [stageResults, lostRes, plWonRes] = await Promise.all([
            Promise.all(
              sortedStages.map((stage) =>
                ghlFetch(
                  `/opportunities/search?location_id=${locationId}&pipeline_id=${pl.id}&pipeline_stage_id=${stage.id}&status=open&limit=1`,
                  token
                ).then((r) => r.ok ? r.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve(empty))
              )
            ),
            ghlFetch(
              `/opportunities/search?location_id=${locationId}&pipeline_id=${pl.id}&status=lost&limit=1`,
              token
            ).then((r) => r.ok ? r.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve(empty)),
            ghlFetch(
              `/opportunities/search?location_id=${locationId}&pipeline_id=${pl.id}&status=won&limit=100`,
              token
            ).then((r) => r.ok ? r.json() as Promise<GHLListResponse<GHLOpportunity>> : Promise.resolve(empty)),
          ]);

          const lostCount = (lostRes as GHLListResponse<GHLOpportunity>).meta?.total ?? 0;
          const plWonOpps = (plWonRes as GHLListResponse<GHLOpportunity>).opportunities ?? [];
          const plWonCount = (plWonRes as GHLListResponse<GHLOpportunity>).meta?.total ?? plWonOpps.length;
          const wonRevenue = plWonOpps.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0);
          const closeRate = plWonCount + lostCount > 0
            ? Math.round((plWonCount / (plWonCount + lostCount)) * 100)
            : null;
          const avgDealValue = plWonCount > 0 ? Math.round(wonRevenue / plWonCount) : null;
          const stages = sortedStages.map((stage, i) => ({
            name: stage.name,
            count: (stageResults[i] as GHLListResponse<GHLOpportunity>).meta?.total ?? 0,
          }));

          return { pipelineName: pl.name, stages, lostCount, wonCount: plWonCount, wonRevenue, closeRate, avgDealValue };
        })
      );

      // Sort by close rate descending for the leaderboard view
      pipelines.sort((a, b) => (b.closeRate ?? -1) - (a.closeRate ?? -1));
    }
  } catch {
    // Pipeline fetch failed — basic KPIs still return correctly
  }

  // Aggregate close rate uses total won (from global query) vs sum of per-pipeline lost counts,
  // which is more accurate than summing per-pipeline won counts (avoids double-counting).
  const totalLostCount = pipelines.reduce((sum, p) => sum + p.lostCount, 0);
  const closeRate = totalWonCount + totalLostCount > 0
    ? Math.round((totalWonCount / (totalWonCount + totalLostCount)) * 100)
    : null;
  const avgDealValue = totalWonCount > 0 ? Math.round(closedRevenue / totalWonCount) : null;

  return { contacts, opportunities, closedRevenue, closeRate, avgDealValue, pipelines };
}
