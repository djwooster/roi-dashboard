"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useDemoMode } from "@/lib/demo-context";
import { leadSources } from "@/lib/mock-data";

function fmtK(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-[#e5e5e5] bg-white rounded-lg p-3 text-xs shadow-none">
      <p className="font-semibold text-[#0a0a0a] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="text-[#a3a3a3]">{p.name}</span>
          <span className="font-mono font-medium" style={{ color: p.name === "Revenue" ? "#15803d" : "#525252" }}>
            {fmtK(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueChart() {
  const demo = useDemoMode();
  const data = demo
    ? leadSources.map((s) => ({
        name: s.name.replace(" Ads", "").replace(" Search", ""),
        Revenue: s.closedRevenue,
        Spend: s.spend,
      }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#0a0a0a]">Revenue vs Spend by Source</h2>
        <div className="flex items-center gap-4 text-[11px] text-[#a3a3a3]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-[#0a0a0a] inline-block" />Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-[#d4d4d4] inline-block" />Spend
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="28%" barGap={3} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a3a3a3", fontFamily: "inherit" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: "#a3a3a3", fontFamily: "inherit" }} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
          <Bar dataKey="Revenue" fill="#0a0a0a" radius={[2, 2, 0, 0]} isAnimationActive />
          <Bar dataKey="Spend" fill="#d4d4d4" radius={[2, 2, 0, 0]} isAnimationActive />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
