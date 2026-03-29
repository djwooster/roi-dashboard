"use client";

import { motion } from "framer-motion";
import { pipelineStages } from "@/lib/mock-data";

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function PipelineFunnel() {
  const maxCount = pipelineStages[0].count;

  // Exclude "Closed Lost" from the funnel width calculation
  const funnelStages = pipelineStages.filter(
    (s) => s.name !== "Closed Lost"
  );
  const lostStage = pipelineStages.find((s) => s.name === "Closed Lost");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#0a0a0a]">Pipeline Funnel</h2>
        <span className="text-[11px] text-[#a3a3a3]">Current opportunities</span>
      </div>

      <div className="space-y-1.5">
        {funnelStages.map((stage, i) => {
          const next = funnelStages[i + 1];
          const pct = Math.round((stage.count / maxCount) * 100);
          const convPct = next
            ? Math.round((next.count / stage.count) * 100)
            : null;

          return (
            <div key={stage.name}>
              <div className="flex items-center gap-3">
                {/* Label */}
                <div className="w-40 shrink-0">
                  <p className="text-xs font-medium text-[#0a0a0a] truncate">
                    {stage.name}
                  </p>
                  <p className="text-[10px] text-[#a3a3a3]">
                    {fmtMoney(stage.value)}
                  </p>
                </div>

                {/* Bar */}
                <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.6,
                      delay: 0.6 + i * 0.08,
                      ease: "easeOut",
                    }}
                    className="h-full flex items-center pl-3 rounded"
                    style={{
                      backgroundColor:
                        stage.name === "Closed Won" ? "#166534" : "#0a0a0a",
                      minWidth: 40,
                    }}
                  >
                    <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                      {stage.count}
                    </span>
                  </motion.div>
                </div>

                {/* Percentage of max */}
                <div className="w-10 shrink-0 text-right">
                  <span className="text-[11px] font-mono text-[#a3a3a3]">
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Conversion arrow */}
              {convPct !== null && (
                <div className="flex items-center gap-3 py-0.5">
                  <div className="w-40 shrink-0" />
                  <div className="flex-1 flex items-center gap-1.5 pl-1">
                    <div className="w-px h-3 bg-[#e5e5e5] ml-3" />
                    <span className="text-[10px] text-[#a3a3a3]">
                      {convPct}% converted →
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Closed Lost */}
        {lostStage && (
          <div className="mt-3 pt-3 border-t border-[#f5f5f5]">
            <div className="flex items-center gap-3">
              <div className="w-40 shrink-0">
                <p className="text-xs font-medium text-[#a3a3a3] truncate">
                  {lostStage.name}
                </p>
                <p className="text-[10px] text-[#a3a3a3]">
                  {fmtMoney(lostStage.value)}
                </p>
              </div>
              <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.round((lostStage.count / maxCount) * 100)}%`,
                  }}
                  transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
                  className="h-full flex items-center pl-3 rounded bg-red-100"
                  style={{ minWidth: 40 }}
                >
                  <span className="text-[11px] font-semibold text-red-700 whitespace-nowrap">
                    {lostStage.count}
                  </span>
                </motion.div>
              </div>
              <div className="w-10 shrink-0 text-right">
                <span className="text-[11px] font-mono text-[#a3a3a3]">
                  {Math.round((lostStage.count / maxCount) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
