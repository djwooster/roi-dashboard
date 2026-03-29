"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  LeadSource,
  getCPL,
  getROAS,
  getROI,
  monthlyTrend,
  sourceSubChannels,
  lastPeriodSources,
  currentPeriod,
} from "@/lib/mock-data";

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

type Props = {
  source: LeadSource | null;
  onClose: () => void;
};

function SparkTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-[10px] bg-[#0a0a0a] text-white px-1.5 py-1 rounded">
      {payload[0].value} leads
    </div>
  );
}

export default function SourceDrawer({ source, onClose }: Props) {
  if (!source) return null;

  const sparkData = monthlyTrend.map((m) => ({
    month: m.month,
    leads: m[source.name] as number,
  }));

  const subChannels = sourceSubChannels[source.id] ?? [];
  const topChannels = subChannels.slice(0, 3);

  const lastPeriod = lastPeriodSources.find((s) => s.id === source.id);
  const currentCPL = getCPL(source);
  const prevCPL = lastPeriod ? getCPL(lastPeriod) : currentCPL;
  const cplDelta = prevCPL > 0 ? ((currentCPL - prevCPL) / prevCPL) * 100 : 0;
  const cplImproved = cplDelta < 0; // lower CPL = better

  // Projected monthly values
  const { daysElapsed, daysInMonth } = currentPeriod;
  const projectedRevenue = (source.closedRevenue / daysElapsed) * daysInMonth;
  const projectedROI = source.spend > 0
    ? ((projectedRevenue - source.spend) / source.spend) * 100
    : 0;

  const currentROAS = getROAS(source);
  const prevROAS = lastPeriod ? getROAS(lastPeriod) : currentROAS;
  const roasDelta = prevROAS > 0 ? ((currentROAS - prevROAS) / prevROAS) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        key="drawer"
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed right-0 top-0 bottom-0 w-[400px] bg-white border-l border-[#e5e5e5] z-30 flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e5e5] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: source.color }}
            />
            <div>
              <h3 className="text-sm font-semibold text-[#0a0a0a]">
                {source.name}
              </h3>
              <p className="text-[11px] text-[#a3a3a3]">Source drill-down</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f5f5f5] text-[#a3a3a3] hover:text-[#0a0a0a] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Sparkline */}
          <div>
            <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">
              Lead Trend (6 months)
            </p>
            <div className="border border-[#e5e5e5] rounded-lg p-3">
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke={source.color}
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Tooltip content={<SparkTooltip />} cursor={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-1">
                {sparkData.map((d) => (
                  <span key={d.month} className="text-[10px] text-[#d4d4d4]">
                    {d.month}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CPL Trend */}
          <div>
            <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">
              CPL Trend
            </p>
            <div className="border border-[#e5e5e5] rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold text-[#0a0a0a] font-mono">
                  {fmtMoney(currentCPL)}
                </p>
                <p className="text-[11px] text-[#a3a3a3]">Cost per lead</p>
              </div>
              <div className="text-right">
                <div
                  className={`flex items-center gap-1 justify-end text-sm font-medium ${
                    cplImproved ? "text-green-600" : "text-red-500"
                  }`}
                >
                  <span>{cplImproved ? "↓" : "↑"}</span>
                  <span>{Math.abs(cplDelta).toFixed(1)}%</span>
                </div>
                <p className="text-[11px] text-[#a3a3a3]">
                  was {fmtMoney(prevCPL)} last period
                </p>
              </div>
            </div>
          </div>

          {/* Top sub-channels */}
          <div>
            <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">
              Top Sub-Channels
            </p>
            <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
              {topChannels.length === 0 ? (
                <p className="px-4 py-3 text-xs text-[#a3a3a3]">
                  No campaign data available.
                </p>
              ) : (
                topChannels.map((ch, i) => {
                  const chRoas = ch.spend > 0 ? ch.revenue / ch.spend : 0;
                  const roasColor =
                    chRoas >= 20
                      ? "text-green-700"
                      : chRoas >= 10
                      ? "text-amber-600"
                      : "text-red-500";
                  return (
                    <div
                      key={ch.name}
                      className={`px-4 py-2.5 flex items-center justify-between ${
                        i < topChannels.length - 1
                          ? "border-b border-[#f5f5f5]"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 mr-3">
                        <p className="text-xs font-medium text-[#0a0a0a] truncate">
                          {ch.name}
                        </p>
                        <p className="text-[10px] text-[#a3a3a3]">
                          {ch.leads} leads · {fmtMoney(ch.spend)} spend
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono text-green-700 font-medium">
                          {fmtMoney(ch.revenue)}
                        </p>
                        <p className={`text-[10px] font-mono ${roasColor}`}>
                          {ch.spend > 0 ? `${chRoas.toFixed(1)}x ROAS` : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ROAS vs last period */}
          <div>
            <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">
              ROAS vs Last Period
            </p>
            <div className="border border-[#e5e5e5] rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold text-[#0a0a0a] font-mono">
                  {currentROAS.toFixed(1)}x
                </p>
                <p className="text-[11px] text-[#a3a3a3]">Return on ad spend</p>
              </div>
              <div className="text-right">
                <div
                  className={`flex items-center gap-1 justify-end text-sm font-medium ${
                    roasDelta >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  <span>{roasDelta >= 0 ? "↑" : "↓"}</span>
                  <span>{Math.abs(roasDelta).toFixed(1)}%</span>
                </div>
                <p className="text-[11px] text-[#a3a3a3]">
                  was {prevROAS.toFixed(1)}x last period
                </p>
              </div>
            </div>
          </div>

          {/* Projected Monthly ROI */}
          <div>
            <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">
              Projected Month-End
            </p>
            <div className="border border-[#e5e5e5] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#525252]">Projected Revenue</span>
                <span className="text-xs font-mono font-semibold text-green-700">
                  {fmtMoney(projectedRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#525252]">Projected ROI</span>
                <span className="text-xs font-mono font-semibold text-[#0a0a0a]">
                  {projectedROI.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#525252]">Daily revenue pace</span>
                <span className="text-xs font-mono text-[#525252]">
                  {fmtMoney(source.closedRevenue / daysElapsed)}/day
                </span>
              </div>
              <p className="text-[10px] text-[#a3a3a3] pt-1 border-t border-[#f5f5f5]">
                Based on {daysElapsed} days elapsed of {daysInMonth}-day month
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
