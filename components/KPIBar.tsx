"use client";

import { motion } from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import type { MetaInsightsResponse } from "@/app/api/meta/insights/route";
import type { GHLSyncResponse } from "@/app/api/ghl/sync/route";
import {
  getTotals,
  kpiDeltas,
  monthlyGoals,
  dateRangeMultipliers,
} from "@/lib/mock-data";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtRaw(n: number, style: "currency" | "number" | "decimal"): string {
  if (style === "currency") {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }
  if (style === "decimal") return n.toFixed(1) + "x";
  if (n >= 1_000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toFixed(0);
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ── Demo card ─────────────────────────────────────────────────────────────────

type DemoCardProps = {
  label: string;
  rawValue: number;
  format: "currency" | "number" | "decimal";
  goal: number;
  goalLabel: string;
  lowerBetter?: boolean;
  delta: number;
  index: number;
};

function DemoKPICard({ label, rawValue, format, goal, goalLabel, lowerBetter, delta, index }: DemoCardProps) {
  const animated = useAnimatedNumber(rawValue);
  const positive = delta >= 0;
  const progressPct = lowerBetter
    ? Math.min((goal / Math.max(animated, 0.01)) * 100, 100)
    : Math.min((animated / goal) * 100, 100);
  const progressColor =
    progressPct >= 80 ? "bg-green-500" : progressPct >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="flex-1 min-w-0 border border-[#e5e5e5] rounded-lg p-4 bg-white"
    >
      <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold text-[#0a0a0a] tracking-tight leading-none tabular-nums">
          {fmtRaw(animated, format)}
        </p>
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0 ${positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {positive ? "+" : ""}{delta.toFixed(1)}%
        </span>
      </div>
      <p className="text-[11px] text-[#a3a3a3] mt-1 mb-2.5">vs last month</p>
      <div>
        <div className="h-1 bg-[#f5f5f5] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.7, delay: index * 0.05 + 0.3, ease: "easeOut" }}
            className={`h-full rounded-full ${progressColor}`}
          />
        </div>
        <p className="text-[10px] text-[#d4d4d4] mt-1">{Math.round(progressPct)}% of {goalLabel} goal</p>
      </div>
    </motion.div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonKPICard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="flex-1 min-w-0 border border-[#e5e5e5] rounded-lg p-4 bg-white"
    >
      <div className="animate-pulse space-y-2.5">
        <div className="h-2 w-20 bg-[#ebebeb] rounded" />
        <div className="h-7 w-24 bg-[#ebebeb] rounded" />
        <div className="h-2 w-14 bg-[#ebebeb] rounded" />
        <div className="h-1 w-full bg-[#ebebeb] rounded-full mt-3" />
        <div className="h-2 w-16 bg-[#ebebeb] rounded" />
      </div>
    </motion.div>
  );
}

// ── Real data card ────────────────────────────────────────────────────────────

function LiveKPICard({ label, value, sublabel, index }: { label: string; value: string | null; sublabel: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="flex-1 min-w-0 border border-[#e5e5e5] rounded-lg p-4 bg-white"
    >
      <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight leading-none ${value ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
        {value ?? "—"}
      </p>
      <p className="text-[11px] text-[#e5e5e5] mt-1">{value ? sublabel : "No data yet"}</p>
    </motion.div>
  );
}

// ── KPIBar ────────────────────────────────────────────────────────────────────

const CARD_LABELS = ["Revenue Generated", "Ad Spend", "Net Profit", "New Clients", "ROAS"];

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

  // ── Real data mode ──────────────────────────────────────────────────────────
  if (!demo) {
    if (loading) {
      return (
        <div className="flex gap-3">
          {CARD_LABELS.map((label, i) => <SkeletonKPICard key={label} index={i} />)}
        </div>
      );
    }

    const revenue = ghlData?.closedRevenue ?? 0;
    const spend   = metaData?.totals.spend ?? 0;
    const profit  = revenue - spend;
    const wonCount = ghlData?.wonCount ?? 0;
    const roas    = spend > 0 ? revenue / spend : 0;

    const liveCards: { label: string; value: string | null; sublabel: string }[] = [
      { label: "Revenue Generated", value: revenue > 0 ? fmtMoney(revenue) : null,       sublabel: "Closed won deals" },
      { label: "Ad Spend",          value: spend > 0   ? fmtMoney(spend)   : null,       sublabel: "Meta ad spend" },
      { label: "Net Profit",        value: revenue > 0 || spend > 0 ? fmtMoney(profit) : null, sublabel: "After ad spend" },
      { label: "New Clients",       value: wonCount > 0 ? wonCount.toLocaleString() : null, sublabel: "Confirmed paying clients" },
      { label: "ROAS",              value: roas > 0    ? `${roas.toFixed(1)}x`     : null, sublabel: "Return on ad spend" },
    ];

    return (
      <div className="flex gap-3">
        {liveCards.map((card, i) => <LiveKPICard key={card.label} {...card} index={i} />)}
      </div>
    );
  }

  // ── Demo mode ───────────────────────────────────────────────────────────────
  const mult = dateRangeMultipliers["30d"];
  const { totalSpend, totalRevenue, blendedROAS, newClients } = getTotals(mult);
  const netProfit = totalRevenue - totalSpend;

  const demoCards: Omit<DemoCardProps, "index">[] = [
    {
      label: "Revenue Generated",
      rawValue: totalRevenue,
      format: "currency",
      goal: monthlyGoals.totalRevenue * mult,
      goalLabel: fmtRaw(monthlyGoals.totalRevenue * mult, "currency"),
      delta: kpiDeltas.totalRevenue,
    },
    {
      label: "Ad Spend",
      rawValue: totalSpend,
      format: "currency",
      goal: monthlyGoals.totalSpend * mult,
      goalLabel: fmtRaw(monthlyGoals.totalSpend * mult, "currency"),
      lowerBetter: true,
      delta: kpiDeltas.totalSpend,
    },
    {
      label: "Net Profit",
      rawValue: netProfit,
      format: "currency",
      goal: monthlyGoals.netProfit * mult,
      goalLabel: fmtRaw(monthlyGoals.netProfit * mult, "currency"),
      delta: kpiDeltas.netProfit,
    },
    {
      label: "New Clients",
      rawValue: newClients,
      format: "number",
      goal: monthlyGoals.newClients * mult,
      goalLabel: fmtRaw(monthlyGoals.newClients * mult, "number"),
      delta: kpiDeltas.newClients,
    },
    {
      label: "ROAS",
      rawValue: blendedROAS,
      format: "decimal",
      goal: monthlyGoals.blendedROAS,
      goalLabel: `${monthlyGoals.blendedROAS}x`,
      delta: kpiDeltas.blendedROAS,
    },
  ];

  return (
    <div className="flex gap-3">
      {demoCards.map((card, i) => <DemoKPICard key={card.label} {...card} index={i} />)}
    </div>
  );
}
