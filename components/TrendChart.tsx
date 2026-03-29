"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { monthlyTrend, leadSources } from "@/lib/mock-data";

const sourceNames = leadSources.map((s) => s.name);
const sourceColors = Object.fromEntries(
  leadSources.map((s) => [s.name, s.color])
);

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-[#e5e5e5] bg-white rounded-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-[#0a0a0a] mb-2">{label}</p>
      {payload
        .slice()
        .sort((a, b) => b.value - a.value)
        .map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between gap-4 py-0.5"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-[#525252]">{p.name}</span>
            </div>
            <span className="font-mono font-medium text-[#0a0a0a]">
              {p.value}
            </span>
          </div>
        ))}
    </div>
  );
}

function CustomLegend({
  selectedSource,
}: {
  selectedSource: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-3">
      {sourceNames.map((name) => (
        <div key={name} className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 inline-block rounded"
            style={{
              backgroundColor: sourceColors[name],
              opacity:
                selectedSource && selectedSource !== name ? 0.3 : 1,
            }}
          />
          <span
            className="text-[11px]"
            style={{
              color:
                selectedSource && selectedSource !== name
                  ? "#d4d4d4"
                  : "#525252",
            }}
          >
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}

type Props = {
  selectedSource: string | null;
};

export default function TrendChart({ selectedSource }: Props) {
  const [period, setPeriod] = useState<"month" | "6mo">("6mo");

  const displayData =
    period === "month" ? monthlyTrend.slice(-1) : monthlyTrend;

  const selectedName = selectedSource
    ? leadSources.find((s) => s.id === selectedSource)?.name ?? null
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[#0a0a0a]">
            Lead Trend Over Time
          </h2>
          {selectedName && (
            <p className="text-[11px] text-[#a3a3a3] mt-0.5">
              Filtered: {selectedName}
            </p>
          )}
        </div>
        <div className="flex border border-[#e5e5e5] rounded-md overflow-hidden text-[11px]">
          {(["month", "6mo"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 transition-colors ${
                period === p
                  ? "bg-[#0a0a0a] text-white"
                  : "text-[#a3a3a3] hover:text-[#0a0a0a]"
              }`}
            >
              {p === "month" ? "This Month" : "Last 6 Months"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={displayData}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#a3a3a3", fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#a3a3a3", fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} />
          {sourceNames.map((name) => {
            const isActive = !selectedName || selectedName === name;
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={sourceColors[name]}
                strokeWidth={isActive ? 1.5 : 0.5}
                dot={false}
                opacity={isActive ? 1 : 0.2}
                strokeDasharray={isActive ? undefined : "3 3"}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      <CustomLegend selectedSource={selectedName} />
    </motion.div>
  );
}
