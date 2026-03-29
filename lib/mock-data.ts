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

export const campaignBreakdown: CampaignBreakdown = {
  google: [
    {
      name: "Brand — Exact Match",
      leads: 94,
      spend: 4200,
      revenue: 218000,
    },
    {
      name: "Windows — Competitor",
      leads: 112,
      spend: 8600,
      revenue: 264000,
    },
    {
      name: "Doors — Local Intent",
      leads: 78,
      spend: 5600,
      revenue: 130000,
    },
  ],
  facebook: [
    {
      name: "Spring Promo — Retarget",
      leads: 72,
      spend: 3100,
      revenue: 148000,
    },
    {
      name: "Lookalike — Past Buyers",
      leads: 84,
      spend: 4200,
      revenue: 136000,
    },
    {
      name: "Video — Top of Funnel",
      leads: 42,
      spend: 1900,
      revenue: 64000,
    },
  ],
};

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

export function getTotals() {
  const totalLeads = leadSources.reduce((s, r) => s + r.leads, 0);
  const totalSpend = leadSources.reduce((s, r) => s + r.spend, 0);
  const totalRevenue = leadSources.reduce((s, r) => s + r.closedRevenue, 0);
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return { totalLeads, totalSpend, totalRevenue, avgCPL, blendedROAS };
}

// Month-over-month delta mock values
export const kpiDeltas = {
  totalLeads: +12.4,
  totalSpend: +8.1,
  avgCPL: -3.8,
  totalRevenue: +18.2,
  blendedROAS: +9.4,
};
