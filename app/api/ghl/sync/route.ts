import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

type GHLContact = { id: string };
type GHLOpportunity = { monetaryValue?: number };
type GHLStage = { id: string; name: string; position: number };
type GHLPipelineItem = { id: string; name: string; stages: GHLStage[] };

type GHLListResponse<T> = {
  meta?: { total?: number };
  contacts?: T[];
  opportunities?: T[];
};
type GHLPipelinesResponse = { pipelines?: GHLPipelineItem[] };

export type GHLPipelineStage = { name: string; count: number };
export type GHLPipelineData = {
  pipelineName: string;
  stages: GHLPipelineStage[];
  lostCount: number;
};

export type GHLSyncResponse = {
  contacts: number;
  opportunities: number;
  closedRevenue: number;
  closeRate: number | null;
  avgDealValue: number | null;
  pipelines: GHLPipelineData[];
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

  const [contactsRes, oppsRes, wonRes, pipelinesRes] = await Promise.all([
    ghlFetch(`/contacts/?locationId=${locationId}&limit=1`, token),
    ghlFetch(`/opportunities/search?location_id=${locationId}&limit=1`, token),
    ghlFetch(`/opportunities/search?location_id=${locationId}&status=won&limit=100`, token),
    ghlFetch(`/pipelines/?locationId=${locationId}`, token),
  ]);

  const [contactsData, oppsData, wonData, pipelinesData] = await Promise.all([
    contactsRes.json() as Promise<GHLListResponse<GHLContact>>,
    oppsRes.json() as Promise<GHLListResponse<GHLOpportunity>>,
    wonRes.json() as Promise<GHLListResponse<GHLOpportunity>>,
    pipelinesRes.json() as Promise<GHLPipelinesResponse>,
  ]);

  const contacts = contactsData.meta?.total ?? 0;
  const opportunities = oppsData.meta?.total ?? 0;
  const wonOpps = wonData.opportunities ?? [];
  const wonCount = wonData.meta?.total ?? wonOpps.length;
  const closedRevenue = wonOpps.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0);

  // Fetch all pipelines — each may represent a different offer the agency is running
  const allPipelines = pipelinesData.pipelines ?? [];

  const pipelines: GHLPipelineData[] = await Promise.all(
    allPipelines.map(async (pl) => {
      const sortedStages = [...pl.stages].sort((a, b) => a.position - b.position);

      const [stageResults, lostRes] = await Promise.all([
        Promise.all(
          sortedStages.map((stage) =>
            ghlFetch(
              `/opportunities/search?location_id=${locationId}&pipeline_id=${pl.id}&pipeline_stage_id=${stage.id}&status=open&limit=1`,
              token
            ).then((r) => r.json() as Promise<GHLListResponse<GHLOpportunity>>)
          )
        ),
        ghlFetch(
          `/opportunities/search?location_id=${locationId}&pipeline_id=${pl.id}&status=lost&limit=1`,
          token
        ).then((r) => r.json() as Promise<GHLListResponse<GHLOpportunity>>),
      ]);

      const lostCount = lostRes.meta?.total ?? 0;
      const stages: GHLPipelineStage[] = sortedStages.map((stage, i) => ({
        name: stage.name,
        count: stageResults[i].meta?.total ?? 0,
      }));

      return { pipelineName: pl.name, stages, lostCount };
    })
  );

  const totalLostCount = pipelines.reduce((sum, p) => sum + p.lostCount, 0);
  const closeRate =
    wonCount + totalLostCount > 0
      ? Math.round((wonCount / (wonCount + totalLostCount)) * 100)
      : null;
  const avgDealValue = wonCount > 0 ? Math.round(closedRevenue / wonCount) : null;

  return NextResponse.json({
    contacts,
    opportunities,
    closedRevenue,
    closeRate,
    avgDealValue,
    pipelines,
  } satisfies GHLSyncResponse);
}
