"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import KPIBar from "@/components/KPIBar";
import SourceTable from "@/components/SourceTable";
import RevenueChart from "@/components/RevenueChart";
import TrendChart from "@/components/TrendChart";
import PipelineFunnel from "@/components/PipelineFunnel";
import CampaignTables from "@/components/CampaignTables";

export default function Dashboard() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  return (
    <div className="flex h-full bg-white">
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <main className="ml-[220px] flex-1 overflow-y-auto min-h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#e5e5e5] px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-[#0a0a0a]">Overview</h1>
            <p className="text-[11px] text-[#a3a3a3]">March 2026 · All sources</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#525252] border border-[#e5e5e5] rounded-md px-2.5 py-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect
                  x="1"
                  y="2"
                  width="10"
                  height="9"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M4 1v2M8 1v2M1 5h10"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              Mar 1 – Mar 28, 2026
            </div>
            <button className="text-[11px] font-medium text-white bg-[#0a0a0a] px-3 py-1.5 rounded-md hover:bg-[#262626] transition-colors">
              Export
            </button>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="px-6 py-5 space-y-5 max-w-[1400px]">
          {/* 1. KPI Bar */}
          <KPIBar />

          {/* 2. Source Table */}
          <SourceTable
            selectedSource={selectedSource}
            onSelectSource={setSelectedSource}
          />

          {/* 3 + 4. Charts row */}
          <div className="grid grid-cols-2 gap-3">
            <RevenueChart />
            <TrendChart selectedSource={selectedSource} />
          </div>

          {/* 5. Pipeline */}
          <PipelineFunnel />

          {/* 6. Campaigns */}
          <CampaignTables />

          {/* Footer */}
          <div className="pt-2 pb-4 border-t border-[#f5f5f5]">
            <p className="text-[10px] text-[#d4d4d4] text-center">
              ROI Dashboard · Mock data · Last updated Mar 28, 2026
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
