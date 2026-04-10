"use client";

// PipelineLeaderboard — sortable side-by-side comparison of all GHL pipelines.
//
// Complements PipelineFunnel (which shows one pipeline's stage breakdown) by letting
// users rank all their funnels at a glance: which offer closes best, earns most, etc.
//
// Real mode: rendered only when the org has 2+ pipelines (1 pipeline = nothing to compare;
// PipelineFunnel already surfaces the per-pipeline stats in that case).
// Demo mode: always rendered using mock data so the /demo page shows the full product.

import { useState } from "react";
import { motion } from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import { mockPipelines } from "@/lib/mock-data";
import type { GHLPipelineData } from "@/lib/ghl/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// Close rate badge — colour-coded so high/medium/low performers stand out instantly.
function CloseRateBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[#d4d4d4] font-mono text-xs">—</span>;
  const color =
    value >= 60 ? "text-green-700 bg-green-50" :
    value >= 35 ? "text-amber-700 bg-amber-50" :
                  "text-red-600 bg-red-50";
  return (
    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${color}`}>
      {value}%
    </span>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

type SortKey = "name" | "closeRate" | "avgDeal" | "won" | "lost" | "revenue" | "stages";
type SortDir = "asc" | "desc";

const COLS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "name",      label: "Pipeline",    align: "left"  },
  { key: "stages",    label: "Stages",      align: "right" },
  { key: "closeRate", label: "Close Rate",  align: "right" },
  { key: "avgDeal",   label: "Avg Deal",    align: "right" },
  { key: "won",       label: "Won",         align: "right" },
  { key: "lost",      label: "Lost",        align: "right" },
  { key: "revenue",   label: "Revenue",     align: "right" },
];

function sortPipelines(pipelines: GHLPipelineData[], key: SortKey, dir: SortDir): GHLPipelineData[] {
  return [...pipelines].sort((a, b) => {
    let av: number | string = 0;
    let bv: number | string = 0;
    switch (key) {
      case "name":      av = a.pipelineName; bv = b.pipelineName; break;
      case "closeRate": av = a.closeRate ?? -1; bv = b.closeRate ?? -1; break;
      case "avgDeal":   av = a.avgDealValue ?? -1; bv = b.avgDealValue ?? -1; break;
      case "won":       av = a.wonCount;  bv = b.wonCount;  break;
      case "lost":      av = a.lostCount; bv = b.lostCount; break;
      case "revenue":   av = a.wonRevenue; bv = b.wonRevenue; break;
      case "stages":    av = a.stages.length; bv = b.stages.length; break;
    }
    if (typeof av === "string") {
      return dir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    }
    return dir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonLeaderboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.7, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[#e5e5e5]">
        <div className="h-3 w-36 bg-[#ebebeb] rounded animate-pulse" />
      </div>
      <div className="animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#f5f5f5] last:border-0">
            <div className="h-2.5 bg-[#ebebeb] rounded w-40 shrink-0" />
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="flex-1 flex justify-end">
                <div className="h-2.5 bg-[#ebebeb] rounded" style={{ width: `${35 + Math.sin(i + j) * 20}%` }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

function LeaderboardTable({ pipelines }: { pipelines: GHLPipelineData[] }) {
  // Default sort: close rate descending — fetchLocationData already sorts this way
  // server-side, but we let the user re-sort client-side without a network round-trip.
  const [sortKey, setSortKey] = useState<SortKey>("closeRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = sortPipelines(pipelines, sortKey, sortDir);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.7, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[#e5e5e5] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0a0a0a]">Pipeline Leaderboard</h2>
        <span className="text-[11px] text-[#a3a3a3]">Ranked by close rate</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              {COLS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-2.5 font-medium text-[#a3a3a3] cursor-pointer select-none whitespace-nowrap hover:text-[#0a0a0a] transition-colors ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-[#525252]">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((pl, rank) => (
              <tr
                key={pl.pipelineName}
                className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa] transition-colors"
              >
                {/* Rank badge + name */}
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#a3a3a3] w-4 shrink-0">
                      #{rank + 1}
                    </span>
                    <span className="truncate max-w-[200px]" title={pl.pipelineName}>
                      {pl.pipelineName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#525252]">
                  {pl.stages.length}
                </td>
                <td className="px-4 py-3 text-right">
                  <CloseRateBadge value={pl.closeRate} />
                </td>
                <td className={`px-4 py-3 text-right font-mono ${pl.avgDealValue ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
                  {pl.avgDealValue ? fmtMoney(pl.avgDealValue) : "—"}
                </td>
                <td className={`px-4 py-3 text-right font-mono ${pl.wonCount > 0 ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
                  {pl.wonCount > 0 ? pl.wonCount.toLocaleString() : "—"}
                </td>
                <td className={`px-4 py-3 text-right font-mono ${pl.lostCount > 0 ? "text-red-600" : "text-[#d4d4d4]"}`}>
                  {pl.lostCount > 0 ? pl.lostCount.toLocaleString() : "—"}
                </td>
                <td className={`px-4 py-3 text-right font-mono font-medium ${pl.wonRevenue > 0 ? "text-green-700" : "text-[#d4d4d4]"}`}>
                  {pl.wonRevenue > 0 ? fmtMoney(pl.wonRevenue) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

type Props = { pipelines: GHLPipelineData[]; loading?: boolean };

export default function PipelineLeaderboard({ pipelines, loading }: Props) {
  const demo = useDemoMode();

  if (demo) return <LeaderboardTable pipelines={mockPipelines} />;
  if (loading) return <SkeletonLeaderboard />;

  // Only show the leaderboard when there are 2+ pipelines — with a single pipeline
  // the PipelineFunnel stats row already surfaces the same information.
  if (pipelines.length < 2) return null;

  return <LeaderboardTable pipelines={pipelines} />;
}
