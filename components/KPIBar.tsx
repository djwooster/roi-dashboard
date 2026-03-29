"use client";

import { motion } from "framer-motion";
import {
  getTotals,
  kpiDeltas,
  monthlyGoals,
  dateRangeMultipliers,
  DateRange,
} from "@/lib/mock-data";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

function fmtRaw(n: number, style: "currency" | "number" | "decimal"): string {
  if (style === "currency") {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }
  if (style === "decimal") return n.toFixed(2) + "x";
  if (n >= 1_000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toFixed(0);
}

type KPICardProps = {
  label: string;
  rawValue: number;
  format: "currency" | "number" | "decimal";
  goal: number;
  goalLabel: string;
  lowerBetter?: boolean;
  delta: number;
  index: number;
};

function KPICard({
  label,
  rawValue,
  format,
  goal,
  goalLabel,
  lowerBetter,
  delta,
  index,
}: KPICardProps) {
  const animated = useAnimatedNumber(rawValue);
  const positive = delta >= 0;

  // Progress toward goal (capped 0–100)
  const progressPct = lowerBetter
    ? Math.min((goal / Math.max(animated, 0.01)) * 100, 100)
    : Math.min((animated / goal) * 100, 100);

  const progressColor =
    progressPct >= 80
      ? "bg-green-500"
      : progressPct >= 50
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="flex-1 min-w-0 border border-[#e5e5e5] rounded-lg p-4 bg-white"
    >
      <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold text-[#0a0a0a] tracking-tight leading-none tabular-nums">
          {fmtRaw(animated, format)}
        </p>
        <span
          className={`text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
            positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {positive ? "+" : ""}
          {delta.toFixed(1)}%
        </span>
      </div>
      <p className="text-[11px] text-[#a3a3a3] mt-1 mb-2.5">vs last month</p>

      {/* Goal progress bar */}
      <div>
        <div className="h-1 bg-[#f5f5f5] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.7, delay: index * 0.05 + 0.3, ease: "easeOut" }}
            className={`h-full rounded-full ${progressColor}`}
          />
        </div>
        <p className="text-[10px] text-[#d4d4d4] mt-1">
          {Math.round(progressPct)}% of {goalLabel} goal
        </p>
      </div>
    </motion.div>
  );
}

type Props = {
  dateRange: DateRange;
};

export default function KPIBar({ dateRange }: Props) {
  const mult = dateRangeMultipliers[dateRange];
  const { totalLeads, totalSpend, avgCPL, totalRevenue, blendedROAS } =
    getTotals(mult);

  const cards: Omit<KPICardProps, "index">[] = [
    {
      label: "Total Leads",
      rawValue: totalLeads,
      format: "number",
      goal: monthlyGoals.totalLeads * mult,
      goalLabel: fmtRaw(monthlyGoals.totalLeads * mult, "number"),
      delta: kpiDeltas.totalLeads,
    },
    {
      label: "Total Spend",
      rawValue: totalSpend,
      format: "currency",
      goal: monthlyGoals.totalSpend * mult,
      goalLabel: fmtRaw(monthlyGoals.totalSpend * mult, "currency"),
      delta: kpiDeltas.totalSpend,
    },
    {
      label: "Avg CPL",
      rawValue: avgCPL,
      format: "currency",
      goal: monthlyGoals.avgCPL,
      goalLabel: fmtRaw(monthlyGoals.avgCPL, "currency"),
      lowerBetter: true,
      delta: kpiDeltas.avgCPL,
    },
    {
      label: "Total Revenue",
      rawValue: totalRevenue,
      format: "currency",
      goal: monthlyGoals.totalRevenue * mult,
      goalLabel: fmtRaw(monthlyGoals.totalRevenue * mult, "currency"),
      delta: kpiDeltas.totalRevenue,
    },
    {
      label: "Blended ROAS",
      rawValue: blendedROAS,
      format: "decimal",
      goal: monthlyGoals.blendedROAS,
      goalLabel: `${monthlyGoals.blendedROAS}x`,
      delta: kpiDeltas.blendedROAS,
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
