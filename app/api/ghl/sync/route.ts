import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";
import { fetchLocationData } from "@/lib/ghl/fetchLocationData";

// Re-export types from the canonical types file so existing component imports
// (e.g. `from "@/app/api/ghl/sync/route"`) continue to work without changes.
export type { GHLPipelineStage, GHLPipelineData, GHLSyncResponse } from "@/lib/ghl/types";

// GET /api/ghl/sync
// Returns KPI and pipeline data for the authenticated user's connected GHL location.
// Called by the dashboard on mount to populate KPIBar, SourceTable, and PipelineFunnel.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { data: integration } = await supabase
    .from("integrations")
    .select("provider_user_id")
    .eq("org_id", orgId)
    .eq("provider", "ghl")
    .eq("status", "active")
    .single();

  if (!integration) return NextResponse.json({ error: "GHL not connected" }, { status: 404 });

  const locationId = integration.provider_user_id;
  if (!locationId) return NextResponse.json({ error: "No GHL location ID stored" }, { status: 400 });

  // Get a valid token — refreshes automatically if expired or expiring soon.
  // Throws and marks integration inactive if the refresh token is also invalid.
  let token: string;
  try {
    token = await getValidGHLToken(orgId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "GHL token unavailable";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  try {
    const data = await fetchLocationData(locationId, token);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "GHL sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
