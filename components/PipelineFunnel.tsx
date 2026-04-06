"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import { pipelineStages } from "@/lib/mock-data";
import type { GHLPipelineData } from "@/app/api/ghl/sync/route";

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STAGE_NAMES = ["New Lead", "Contacted", "Appointment Set", "Proposal Sent", "Closed Won"];

// Funnel-shaped skeleton widths to suggest narrowing stages
const SKELETON_WIDTHS = ["100%", "78%", "58%", "42%", "28%"];

function SkeletonFunnel() {
  return (
    <div className="animate-pulse space-y-1.5">
      {SKELETON_WIDTHS.map((w, i) => (
        <div key={i}>
          <div className="flex items-center gap-3">
            <div className="w-40 shrink-0 space-y-1">
              <div className="h-2.5 bg-[#ebebeb] rounded w-3/4" />
              <div className="h-2 bg-[#ebebeb] rounded w-1/2" />
            </div>
            <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
              <div className="h-full bg-[#ebebeb] rounded" style={{ width: w }} />
            </div>
            <div className="w-10 shrink-0 flex justify-end">
              <div className="h-2.5 bg-[#ebebeb] rounded w-full" />
            </div>
          </div>
          {i < SKELETON_WIDTHS.length - 1 && (
            <div className="flex items-center gap-3 py-0.5">
              <div className="w-40 shrink-0" />
              <div className="flex-1 flex items-center gap-1.5 pl-1">
                <div className="w-px h-3 bg-[#e5e5e5] ml-3" />
                <div className="h-2 bg-[#ebebeb] rounded w-24" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

type Props = { pipelines: GHLPipelineData[]; loading?: boolean };

export default function PipelineFunnel({ pipelines, loading }: Props) {
  const demo = useDemoMode();
  const [selected, setSelected] = useState(0);

  const activePipeline = pipelines[selected] ?? null;
  const showTabs = !demo && pipelines.length > 1;
  const title = demo ? "Pipeline Funnel" : activePipeline?.pipelineName ?? "Pipeline Funnel";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#0a0a0a] truncate max-w-[60%]" title={title}>
          {title}
        </h2>
        <span className="text-[11px] text-[#a3a3a3]">Current opportunities</span>
      </div>

      {/* Pipeline tabs — shown when client has multiple offers/funnels */}
      {showTabs && (
        <div className="flex gap-1 mb-4 overflow-x-auto pb-0.5">
          {pipelines.map((pl, i) => (
            <button
              key={pl.pipelineName}
              onClick={() => setSelected(i)}
              title={pl.pipelineName}
              className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap max-w-[160px] truncate ${
                i === selected
                  ? "bg-[#0a0a0a] text-white"
                  : "bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]"
              }`}
            >
              {pl.pipelineName}
            </button>
          ))}
        </div>
      )}

      {demo ? (
        <DemoPipeline />
      ) : loading ? (
        <SkeletonFunnel />
      ) : activePipeline && activePipeline.stages.length > 0 ? (
        <RealPipeline pipeline={activePipeline} key={selected} />
      ) : (
        <EmptyPipeline />
      )}
    </motion.div>
  );
}

function RealPipeline({ pipeline }: { pipeline: GHLPipelineData }) {
  const maxCount = Math.max(...pipeline.stages.map((s) => s.count), 1);

  return (
    <div className="space-y-1.5">
      {pipeline.stages.map((stage, i) => {
        const next = pipeline.stages[i + 1];
        const pct = Math.round((stage.count / maxCount) * 100);
        const convPct = next && stage.count > 0 ? Math.round((next.count / stage.count) * 100) : null;
        const isWon = i === pipeline.stages.length - 1;
        return (
          <div key={stage.name}>
            <div className="flex items-center gap-3">
              <div className="w-40 shrink-0">
                <p className="text-xs font-medium text-[#0a0a0a] truncate">{stage.name}</p>
                <p className="text-[10px] text-[#d4d4d4]">—</p>
              </div>
              <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                  className="h-full flex items-center pl-3 rounded"
                  style={{ backgroundColor: isWon ? "#166534" : "#0a0a0a", minWidth: 40 }}
                >
                  <span className="text-[11px] font-semibold text-white whitespace-nowrap">{stage.count}</span>
                </motion.div>
              </div>
              <div className="w-10 shrink-0 text-right">
                <span className="text-[11px] font-mono text-[#a3a3a3]">{pct}%</span>
              </div>
            </div>
            {convPct !== null && (
              <div className="flex items-center gap-3 py-0.5">
                <div className="w-40 shrink-0" />
                <div className="flex-1 flex items-center gap-1.5 pl-1">
                  <div className="w-px h-3 bg-[#e5e5e5] ml-3" />
                  <span className="text-[10px] text-[#a3a3a3]">{convPct}% converted →</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {pipeline.lostCount > 0 && (
        <div className="mt-3 pt-3 border-t border-[#f5f5f5]">
          <div className="flex items-center gap-3">
            <div className="w-40 shrink-0">
              <p className="text-xs font-medium text-[#a3a3a3] truncate">Closed Lost</p>
              <p className="text-[10px] text-[#d4d4d4]">—</p>
            </div>
            <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((pipeline.lostCount / maxCount) * 100)}%` }}
                transition={{ duration: 0.6, delay: pipeline.stages.length * 0.08, ease: "easeOut" }}
                className="h-full flex items-center pl-3 rounded bg-red-100"
                style={{ minWidth: 40 }}
              >
                <span className="text-[11px] font-semibold text-red-700 whitespace-nowrap">{pipeline.lostCount}</span>
              </motion.div>
            </div>
            <div className="w-10 shrink-0 text-right">
              <span className="text-[11px] font-mono text-[#a3a3a3]">
                {Math.round((pipeline.lostCount / maxCount) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DemoPipeline() {
  const funnelStages = pipelineStages.filter((s) => s.name !== "Closed Lost");
  const lostStage = pipelineStages.find((s) => s.name === "Closed Lost");
  const maxCount = pipelineStages[0].count;

  return (
    <div className="space-y-1.5">
      {funnelStages.map((stage, i) => {
        const next = funnelStages[i + 1];
        const pct = Math.round((stage.count / maxCount) * 100);
        const convPct = next ? Math.round((next.count / stage.count) * 100) : null;
        return (
          <div key={stage.name}>
            <div className="flex items-center gap-3">
              <div className="w-40 shrink-0">
                <p className="text-xs font-medium text-[#0a0a0a] truncate">{stage.name}</p>
                <p className="text-[10px] text-[#a3a3a3]">{fmtMoney(stage.value)}</p>
              </div>
              <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.6 + i * 0.08, ease: "easeOut" }}
                  className="h-full flex items-center pl-3 rounded"
                  style={{ backgroundColor: stage.name === "Closed Won" ? "#166534" : "#0a0a0a", minWidth: 40 }}
                >
                  <span className="text-[11px] font-semibold text-white whitespace-nowrap">{stage.count}</span>
                </motion.div>
              </div>
              <div className="w-10 shrink-0 text-right">
                <span className="text-[11px] font-mono text-[#a3a3a3]">{pct}%</span>
              </div>
            </div>
            {convPct !== null && (
              <div className="flex items-center gap-3 py-0.5">
                <div className="w-40 shrink-0" />
                <div className="flex-1 flex items-center gap-1.5 pl-1">
                  <div className="w-px h-3 bg-[#e5e5e5] ml-3" />
                  <span className="text-[10px] text-[#a3a3a3]">{convPct}% converted →</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {lostStage && (
        <div className="mt-3 pt-3 border-t border-[#f5f5f5]">
          <div className="flex items-center gap-3">
            <div className="w-40 shrink-0">
              <p className="text-xs font-medium text-[#a3a3a3] truncate">{lostStage.name}</p>
              <p className="text-[10px] text-[#a3a3a3]">{fmtMoney(lostStage.value)}</p>
            </div>
            <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((lostStage.count / maxCount) * 100)}%` }}
                transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
                className="h-full flex items-center pl-3 rounded bg-red-100"
                style={{ minWidth: 40 }}
              >
                <span className="text-[11px] font-semibold text-red-700 whitespace-nowrap">{lostStage.count}</span>
              </motion.div>
            </div>
            <div className="w-10 shrink-0 text-right">
              <span className="text-[11px] font-mono text-[#a3a3a3]">{Math.round((lostStage.count / maxCount) * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyPipeline() {
  return (
    <div className="space-y-1.5">
      {STAGE_NAMES.map((name, i) => (
        <div key={name}>
          <div className="flex items-center gap-3">
            <div className="w-40 shrink-0">
              <p className="text-xs font-medium text-[#0a0a0a] truncate">{name}</p>
              <p className="text-[10px] text-[#d4d4d4]">—</p>
            </div>
            <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
              <div className="h-full flex items-center pl-3 rounded" style={{ width: 40, backgroundColor: "#e5e5e5" }}>
                <span className="text-[11px] font-semibold text-[#a3a3a3] whitespace-nowrap">—</span>
              </div>
            </div>
            <div className="w-10 shrink-0 text-right">
              <span className="text-[11px] font-mono text-[#d4d4d4]">—</span>
            </div>
          </div>
          {i < STAGE_NAMES.length - 1 && (
            <div className="flex items-center gap-3 py-0.5">
              <div className="w-40 shrink-0" />
              <div className="flex-1 flex items-center gap-1.5 pl-1">
                <div className="w-px h-3 bg-[#e5e5e5] ml-3" />
                <span className="text-[10px] text-[#d4d4d4]">— converted →</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
