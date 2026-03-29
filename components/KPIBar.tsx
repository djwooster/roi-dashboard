"use client";

import { motion } from "framer-motion";
import { getTotals, kpiDeltas } from "@/lib/mock-data";

function fmt(n: number, style: "currency" | "number" | "decimal" = "number") {
  if (style === "currency") {
    if (n >= 1_000_000)
      return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }
  if (style === "decimal") return n.toFixed(2) + "x";
  if (n >= 1_000) return n.toLocaleString();
  return n.toString();
}

type KPICardProps = {
  label: string;
  value: string;
  delta: number;
  index: number;
};

function KPICard({ label, value, delta, index }: KPICardProps) {
  const positive = delta >= 0;
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
        <p className="text-2xl font-semibold text-[#0a0a0a] tracking-tight leading-none">
          {value}
        </p>
        <span
          className={`text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
            positive
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {positive ? "+" : ""}
          {delta.toFixed(1)}%
        </span>
      </div>
      <p className="text-[11px] text-[#a3a3a3] mt-1">vs last month</p>
    </motion.div>
  );
}

export default function KPIBar() {
  const { totalLeads, totalSpend, avgCPL, totalRevenue, blendedROAS } =
    getTotals();

  const cards = [
    {
      label: "Total Leads",
      value: fmt(totalLeads),
      delta: kpiDeltas.totalLeads,
    },
    {
      label: "Total Spend",
      value: fmt(totalSpend, "currency"),
      delta: kpiDeltas.totalSpend,
    },
    {
      label: "Avg CPL",
      value: fmt(avgCPL, "currency"),
      delta: kpiDeltas.avgCPL,
    },
    {
      label: "Total Revenue",
      value: fmt(totalRevenue, "currency"),
      delta: kpiDeltas.totalRevenue,
    },
    {
      label: "Blended ROAS",
      value: fmt(blendedROAS, "decimal"),
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
