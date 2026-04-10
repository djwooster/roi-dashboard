export type LeadSource = {
  id: string;
  name: string;
  leads: number;
  spend: number;
  appointments: number;
  closedRevenue: number;
  avgDealValue: number;
  color: string;
};

export type MonthlyData = {
  month: string;
  [source: string]: number | string;
};

export type PipelineStage = {
  name: string;
  count: number;
  value: number;
};

export type Campaign = {
  name: string;
  leads: number;
  spend: number;
  revenue: number;
};

export type CampaignBreakdown = {
  google: Campaign[];
  facebook: Campaign[];
};

export type DateRange = "30d" | "90d" | "6mo" | "ytd";

export const dateRangeLabels: Record<DateRange, string> = {
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "6mo": "Last 6 Months",
  ytd: "Year to Date",
};

// Volume multipliers for date range changes (CPL/ROAS are ratios, stay stable)
export const dateRangeMultipliers: Record<DateRange, number> = {
  "30d": 1.0,
  "90d": 2.85,
  "6mo": 5.4,
  ytd: 2.2,
};

export const leadSources: LeadSource[] = [
  {
    id: "google",
    name: "Google Ads",
    leads: 284,
    spend: 18400,
    appointments: 196,
    closedRevenue: 612000,
    avgDealValue: 8500,
    color: "#525252",
  },
  {
    id: "facebook",
    name: "Facebook Ads",
    leads: 198,
    spend: 9200,
    appointments: 124,
    closedRevenue: 348000,
    avgDealValue: 7200,
    color: "#737373",
  },
  {
    id: "homeshow",
    name: "Home Show",
    leads: 87,
    spend: 12000,
    appointments: 72,
    closedRevenue: 294000,
    avgDealValue: 11200,
    color: "#a3a3a3",
  },
  {
    id: "referral",
    name: "Referral",
    leads: 142,
    spend: 3600,
    appointments: 128,
    closedRevenue: 498000,
    avgDealValue: 9800,
    color: "#404040",
  },
  {
    id: "organic",
    name: "Organic Search",
    leads: 96,
    spend: 1800,
    appointments: 58,
    closedRevenue: 186000,
    avgDealValue: 7600,
    color: "#8a8a8a",
  },
  {
    id: "kiosk",
    name: "iPad Kiosk",
    leads: 63,
    spend: 2400,
    appointments: 44,
    closedRevenue: 124000,
    avgDealValue: 6800,
    color: "#b5b5b5",
  },
];

// Last period data for comparison mode
export const lastPeriodSources: LeadSource[] = [
  {
    id: "google",
    name: "Google Ads",
    leads: 251,
    spend: 16800,
    appointments: 174,
    closedRevenue: 538000,
    avgDealValue: 8200,
    color: "#525252",
  },
  {
    id: "facebook",
    name: "Facebook Ads",
    leads: 168,
    spend: 8400,
    appointments: 108,
    closedRevenue: 302000,
    avgDealValue: 6900,
    color: "#737373",
  },
  {
    id: "homeshow",
    name: "Home Show",
    leads: 72,
    spend: 10500,
    appointments: 61,
    closedRevenue: 244000,
    avgDealValue: 10800,
    color: "#a3a3a3",
  },
  {
    id: "referral",
    name: "Referral",
    leads: 128,
    spend: 3200,
    appointments: 116,
    closedRevenue: 428000,
    avgDealValue: 9400,
    color: "#404040",
  },
  {
    id: "organic",
    name: "Organic Search",
    leads: 84,
    spend: 1600,
    appointments: 51,
    closedRevenue: 162000,
    avgDealValue: 7400,
    color: "#8a8a8a",
  },
  {
    id: "kiosk",
    name: "iPad Kiosk",
    leads: 58,
    spend: 2200,
    appointments: 40,
    closedRevenue: 108000,
    avgDealValue: 6600,
    color: "#b5b5b5",
  },
];

export const monthlyTrend: MonthlyData[] = [
  {
    month: "Oct",
    "Google Ads": 38,
    "Facebook Ads": 28,
    "Home Show": 6,
    Referral: 19,
    "Organic Search": 12,
    "iPad Kiosk": 7,
  },
  {
    month: "Nov",
    "Google Ads": 42,
    "Facebook Ads": 31,
    "Home Show": 0,
    Referral: 22,
    "Organic Search": 14,
    "iPad Kiosk": 9,
  },
  {
    month: "Dec",
    "Google Ads": 35,
    "Facebook Ads": 24,
    "Home Show": 0,
    Referral: 26,
    "Organic Search": 11,
    "iPad Kiosk": 8,
  },
  {
    month: "Jan",
    "Google Ads": 44,
    "Facebook Ads": 32,
    "Home Show": 14,
    Referral: 21,
    "Organic Search": 15,
    "iPad Kiosk": 10,
  },
  {
    month: "Feb",
    "Google Ads": 58,
    "Facebook Ads": 40,
    "Home Show": 22,
    Referral: 28,
    "Organic Search": 20,
    "iPad Kiosk": 13,
  },
  {
    month: "Mar",
    "Google Ads": 67,
    "Facebook Ads": 43,
    "Home Show": 45,
    Referral: 26,
    "Organic Search": 24,
    "iPad Kiosk": 16,
  },
];

export const pipelineStages: PipelineStage[] = [
  { name: "New Lead", count: 312, value: 3432000 },
  { name: "Appointment Set", count: 228, value: 2508000 },
  { name: "Appointment Complete", count: 184, value: 2024000 },
  { name: "Proposal Sent", count: 142, value: 1562000 },
  { name: "Closed Won", count: 97, value: 1062000 },
  { name: "Closed Lost", count: 45, value: 495000 },
];

// Mock pipeline leaderboard data — used by PipelineLeaderboard in demo mode.
// Represents three distinct funnels an agency client might run simultaneously.
// Ordered by close rate descending (same sort applied to real data server-side).
export const mockPipelines = [
  {
    pipelineName: "Home Services — Inbound",
    stages: [
      { name: "New Lead", count: 312 },
      { name: "Appointment Set", count: 228 },
      { name: "Appointment Complete", count: 184 },
      { name: "Proposal Sent", count: 142 },
      { name: "Closed Won", count: 97 },
    ],
    wonCount: 97,
    lostCount: 45,
    wonRevenue: 1062000,
    closeRate: 68,
    avgDealValue: 10948,
  },
  {
    pipelineName: "Remodeling — Outbound",
    stages: [
      { name: "New Lead", count: 188 },
      { name: "Contacted", count: 134 },
      { name: "Appointment Set", count: 88 },
      { name: "Proposal Sent", count: 61 },
      { name: "Closed Won", count: 38 },
    ],
    wonCount: 38,
    lostCount: 29,
    wonRevenue: 532000,
    closeRate: 57,
    avgDealValue: 14000,
  },
  {
    pipelineName: "Windows & Doors — Cold",
    stages: [
      { name: "New Lead", count: 410 },
      { name: "Contacted", count: 248 },
      { name: "Appointment Set", count: 104 },
      { name: "Proposal Sent", count: 58 },
      { name: "Closed Won", count: 21 },
    ],
    wonCount: 21,
    lostCount: 41,
    wonRevenue: 231000,
    closeRate: 34,
    avgDealValue: 11000,
  },
];

export const campaignBreakdown: CampaignBreakdown = {
  google: [
    { name: "Brand — Exact Match", leads: 94, spend: 4200, revenue: 218000 },
    { name: "Windows — Competitor", leads: 112, spend: 8600, revenue: 264000 },
    { name: "Doors — Local Intent", leads: 78, spend: 5600, revenue: 130000 },
  ],
  facebook: [
    { name: "Spring Promo — Retarget", leads: 72, spend: 3100, revenue: 148000 },
    { name: "Lookalike — Past Buyers", leads: 84, spend: 4200, revenue: 136000 },
    { name: "Video — Top of Funnel", leads: 42, spend: 1900, revenue: 64000 },
  ],
};

// Sub-channels shown in the drill-down drawer
export type SubChannel = {
  name: string;
  leads: number;
  spend: number;
  revenue: number;
};

export const sourceSubChannels: Record<string, SubChannel[]> = {
  google: [
    { name: "Brand — Exact Match", leads: 94, spend: 4200, revenue: 218000 },
    { name: "Windows — Competitor", leads: 112, spend: 8600, revenue: 264000 },
    { name: "Doors — Local Intent", leads: 78, spend: 5600, revenue: 130000 },
  ],
  facebook: [
    { name: "Spring Promo — Retarget", leads: 72, spend: 3100, revenue: 148000 },
    { name: "Lookalike — Past Buyers", leads: 84, spend: 4200, revenue: 136000 },
    { name: "Video — Top of Funnel", leads: 42, spend: 1900, revenue: 64000 },
  ],
  homeshow: [
    { name: "Spring Home Expo", leads: 45, spend: 6000, revenue: 162000 },
    { name: "Regional Builder Show", leads: 28, spend: 4200, revenue: 96000 },
    { name: "Kitchen & Bath Fair", leads: 14, spend: 1800, revenue: 36000 },
  ],
  referral: [
    { name: "Past Customer", leads: 68, spend: 0, revenue: 248000 },
    { name: "Contractor Partner", leads: 42, spend: 1800, revenue: 158000 },
    { name: "Online Review", leads: 32, spend: 1800, revenue: 92000 },
  ],
  organic: [
    { name: "Windows Keywords", leads: 44, spend: 800, revenue: 94000 },
    { name: "Doors Keywords", leads: 32, spend: 600, revenue: 68000 },
    { name: "Brand Searches", leads: 20, spend: 400, revenue: 24000 },
  ],
  kiosk: [
    { name: "Home Depot #4221", leads: 28, spend: 1100, revenue: 58000 },
    { name: "Lowe's #0847", leads: 22, spend: 900, revenue: 44000 },
    { name: "Expo Center", leads: 13, spend: 400, revenue: 22000 },
  ],
};

// Monthly goal targets
export const monthlyGoals = {
  totalLeads: 1000,
  totalSpend: 55000,
  avgCPL: 65, // max budget (lower is better)
  totalRevenue: 2500000,
  blendedROAS: 40,
};

// Active ROAS alerts (sources performing below threshold)
export const roasAlerts: string[] = ["facebook"];

// Projection constants (current period: March, 28 days elapsed of 31)
export const currentPeriod = { daysElapsed: 28, daysInMonth: 31 };

// Derived helpers
export function getCPL(source: LeadSource): number {
  return source.leads > 0 ? source.spend / source.leads : 0;
}

export function getCostPerAppt(source: LeadSource): number {
  return source.appointments > 0 ? source.spend / source.appointments : 0;
}

export function getROAS(source: LeadSource): number {
  return source.spend > 0 ? source.closedRevenue / source.spend : 0;
}

export function getROI(source: LeadSource): number {
  return source.spend > 0
    ? ((source.closedRevenue - source.spend) / source.spend) * 100
    : 0;
}

export function getTotals(multiplier = 1) {
  const totalLeads = Math.round(
    leadSources.reduce((s, r) => s + r.leads, 0) * multiplier
  );
  const totalSpend = leadSources.reduce((s, r) => s + r.spend, 0) * multiplier;
  const totalRevenue =
    leadSources.reduce((s, r) => s + r.closedRevenue, 0) * multiplier;
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const newClients = Math.round(
    leadSources.reduce((s, r) => s + r.closedRevenue / r.avgDealValue, 0) * multiplier
  );
  return { totalLeads, totalSpend, totalRevenue, avgCPL, blendedROAS, newClients };
}

// Month-over-month delta mock values
export const kpiDeltas = {
  totalLeads: +12.4,
  totalSpend: +8.1,
  avgCPL: -3.8,
  totalRevenue: +18.2,
  blendedROAS: +9.4,
  newClients: +14.7,
};
