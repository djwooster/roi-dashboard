"use client";

import { motion } from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import type { MetaInsightsResponse } from "@/app/api/meta/insights/route";
import type { GHLSyncResponse } from "@/app/api/ghl/sync/route";
import { getTotals, kpiDeltas } from "@/lib/mock-data";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtNumber(n: number): string {
  if (n >= 1_000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toFixed(0);
}

function fmtROAS(n: number): string {
  return `${n.toFixed(1)}x`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconRevenue() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5v13M5 4.5c0-.83.67-1.5 1.5-1.5h3a1.5 1.5 0 010 3H6.5A1.5 1.5 0 005 7.5v0A1.5 1.5 0 006.5 9h3A1.5 1.5 0 0011 10.5v0A1.5 1.5 0 009.5 12h-3A1.5 1.5 0 015 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconSpend() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4.5h12M2 4.5v7a1 1 0 001 1h10a1 1 0 001-1v-7M2 4.5l1-2h10l1 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="8.5" r="1.2" fill="currentColor"/>
    </svg>
  );
}

function IconNetProfit() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 11.5l4-4 3 2.5 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 4h3.5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconClients() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M11 3.5a2 2 0 010 3M13.5 13c0-1.93-1.12-3.6-2.75-4.37" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconROAS() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="9" width="2.5" height="5" rx="0.5" fill="currentColor" opacity="0.5"/>
      <rect x="6" y="6" width="2.5" height="8" rx="0.5" fill="currentColor" opacity="0.7"/>
      <rect x="10" y="3" width="2.5" height="11" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

// ── Card variants ─────────────────────────────────────────────────────────────

type CardConfig = {
  label: string;
  sublabel: string;
  value: string;
  icon: React.ReactNode;
  index: number;
};

function KPICard({ label, sublabel, value, icon, index }: CardConfig) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      className="flex-1 min-w-0 rounded-xl p-5 bg-white border border-[#e5e5e5]"
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] flex items-center justify-center mb-4 text-[#737373]">
        {icon}
      </div>

      {/* Value */}
      <p className="text-[1.75rem] font-bold leading-none tracking-tight tabular-nums text-[#0a0a0a]">
        {value}
      </p>

      {/* Label + sublabel */}
      <p className="text-sm font-semibold text-[#0a0a0a] mt-2">{label}</p>
      <p className="text-[11px] text-[#a3a3a3] mt-0.5 leading-snug">{sublabel}</p>
    </motion.div>
  );
}

function SkeletonKPICard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      className="flex-1 min-w-0 rounded-xl p-5 bg-white border border-[#ebebeb]"
    >
      <div className="animate-pulse space-y-3">
        <div className="w-9 h-9 bg-[#ebebeb] rounded-lg" />
        <div className="h-8 w-24 bg-[#ebebeb] rounded mt-4" />
        <div className="h-3 w-28 bg-[#ebebeb] rounded" />
        <div className="h-2.5 w-20 bg-[#ebebeb] rounded" />
      </div>
    </motion.div>
  );
}

// ── KPIBar ────────────────────────────────────────────────────────────────────

export default function KPIBar({
  metaData,
  ghlData,
  loading,
}: {
  metaData?: MetaInsightsResponse | null;
  ghlData?: GHLSyncResponse | null;
  loading?: boolean;
}) {
  const demo = useDemoMode();

  if (!demo && loading) {
    return (
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonKPICard key={i} index={i} />)}
      </div>
    );
  }

  let revenue: number, spend: number, wonCount: number;

  if (demo) {
    const mult = 1; // always 30d for demo KPIs
    const totals = getTotals(mult);
    revenue  = totals.totalRevenue;
    spend    = totals.totalSpend;
    wonCount = totals.newClients;
  } else {
    revenue  = ghlData?.closedRevenue ?? 0;
    spend    = metaData?.totals.spend ?? 0;
    wonCount = ghlData?.wonCount ?? 0;
  }

  const netProfit = revenue - spend;
  const roas = spend > 0 ? revenue / spend : 0;

  const cards: Omit<CardConfig, "index">[] = [
    {
      label: "Revenue Generated",
      sublabel: "Closed won deals",
      value: revenue > 0 ? fmtMoney(revenue) : "—",
      icon: <IconRevenue />,
    },
    {
      label: "Ad Spend",
      sublabel: "Meta + Google ads",
      value: spend > 0 ? fmtMoney(spend) : "—",
      icon: <IconSpend />,
    },
    {
      label: "Net Profit",
      sublabel: "After ad spend",
      value: revenue > 0 || spend > 0 ? fmtMoney(netProfit) : "—",
      icon: <IconNetProfit />,
    },
    {
      label: "New Clients",
      sublabel: "Confirmed paying clients",
      value: wonCount > 0 ? fmtNumber(wonCount) : "—",
      icon: <IconClients />,
    },
    {
      label: "ROAS",
      sublabel: "Return on ad spend",
      value: roas > 0 ? fmtROAS(roas) : "—",
      icon: <IconROAS />,
    },
  ];

  return (
    <div className="flex gap-3">
      {cards.map((card, i) => (
        <KPICard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
}
