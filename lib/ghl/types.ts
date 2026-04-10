// Shared GHL API types used across the sync route, report page, and components.
// Centralised here so route files don't become type-definition files.

export type GHLOpportunity = { monetaryValue?: number };

export type GHLListResponse<T> = {
  meta?: { total?: number };
  contacts?: T[];
  opportunities?: T[];
};

export type GHLStage = { id: string; name: string; position: number };

export type GHLPipelineItem = { id: string; name: string; stages: GHLStage[] };

export type GHLPipelinesResponse = { pipelines?: GHLPipelineItem[] };

export type GHLPipelineStage = { name: string; count: number };

export type GHLPipelineData = {
  pipelineName: string;
  stages: GHLPipelineStage[];
  lostCount: number;
  wonCount: number;
  wonRevenue: number;
  closeRate: number | null;    // per-pipeline: wonCount / (wonCount + lostCount)
  avgDealValue: number | null; // per-pipeline: wonRevenue / wonCount
};

// Minimal appointment shape from the GHL calendar events API.
// title often contains the contact name; contact.name is more reliable when present.
export type GHLAppointment = {
  id: string;
  title?: string;
  startTime: string | number; // ISO string or epoch ms — API returns both depending on version
  calendarId?: string;
  contactId?: string;
  contact?: { id: string; name?: string; email?: string; phone?: string };
  appointmentStatus?: string;
};

export type GHLSyncResponse = {
  contacts: number;
  opportunities: number;
  wonCount: number;            // total closed-won opportunity count
  closedRevenue: number;
  closeRate: number | null;    // aggregate across all pipelines
  avgDealValue: number | null; // aggregate across all pipelines
  pipelines: GHLPipelineData[];
  // Funnel stage counts — 0 until the relevant integrations are live:
  // bookedCount: requires calendars.readonly scope on the GHL sub-account app
  // showedCount: requires appointment_confirmations table + med spa owner to confirm
  bookedCount: number;
  showedCount: number;
};
