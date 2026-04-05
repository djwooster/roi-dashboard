"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import KPIBar from "@/components/KPIBar";
import SourceTable from "@/components/SourceTable";
import RevenueChart from "@/components/RevenueChart";
import TrendChart from "@/components/TrendChart";
import PipelineFunnel from "@/components/PipelineFunnel";
import CampaignTables from "@/components/CampaignTables";
import LiveTicker from "@/components/LiveTicker";
import IntegrationsPage from "@/components/IntegrationsPage";
import SettingsPage from "@/components/SettingsPage";
import { dateRangeLabels, DateRange } from "@/lib/mock-data";

const DATE_RANGES: DateRange[] = ["30d", "90d", "6mo", "ytd"];

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-[#0a0a0a] text-white text-xs font-medium px-4 py-2.5 rounded-lg"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.2" />
        <path d="M4 6.5l2 2 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </motion.div>
  );
}

// ── Export menu ───────────────────────────────────────────────────────────────
function ExportMenu({ onToast }: { onToast: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items: { label: string; icon: React.ReactNode; action: () => void }[] = [
    {
      label: "Export CSV",
      icon: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 9.5h8M6 2v5.5M4 5.5L6 7.5l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => {
        setOpen(false);
        onToast("CSV export started — check your downloads.");
      },
    },
    {
      label: "Export PDF",
      icon: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="1.5" y="1" width="9" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3.5 4h5M3.5 6h5M3.5 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
      action: () => {
        setOpen(false);
        onToast("PDF report is being generated.");
      },
    },
    {
      label: "Share Link",
      icon: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M5 6.5a2.5 2.5 0 003.54 0l1-1a2.5 2.5 0 00-3.54-3.54L5.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M7 5.5a2.5 2.5 0 00-3.54 0l-1 1a2.5 2.5 0 003.54 3.54L6.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
      action: () => {
        setOpen(false);
        onToast("Shareable link copied to clipboard!");
      },
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-white bg-[#0a0a0a] px-3 py-1.5 rounded-md hover:bg-[#262626] transition-colors"
      >
        Export
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5l3 3 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-44 border border-[#e5e5e5] bg-white rounded-lg overflow-hidden z-50"
          >
            {items.map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#525252] hover:bg-[#f5f5f5] hover:text-[#0a0a0a] transition-colors text-left ${
                  i < items.length - 1 ? "border-b border-[#f5f5f5]" : ""
                }`}
              >
                <span className="text-[#a3a3a3]">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Date range picker ─────────────────────────────────────────────────────────
function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] text-[#525252] border border-[#e5e5e5] rounded-md px-2.5 py-1.5 hover:border-[#a3a3a3] transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="1" y="2" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {dateRangeLabels[value]}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`transition-transform ml-0.5 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-44 border border-[#e5e5e5] bg-white rounded-lg overflow-hidden z-50"
          >
            {DATE_RANGES.map((r, i) => (
              <button
                key={r}
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                  i < DATE_RANGES.length - 1 ? "border-b border-[#f5f5f5]" : ""
                } ${
                  value === r
                    ? "bg-[#f5f5f5] text-[#0a0a0a] font-medium"
                    : "text-[#525252] hover:bg-[#fafafa]"
                }`}
              >
                {dateRangeLabels[r]}
                {value === r && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#0a0a0a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<string>("overview");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(null), []);

  const isOverview = currentPage === "overview";
  const isIntegrations = currentPage === "integrations";
  const isSettings = currentPage === "settings";
  const headerTitle = isSettings ? "Settings" : isIntegrations ? "Integrations" : "Overview";
  const headerSub = isSettings
    ? "Manage your account and team"
    : isIntegrations
    ? "Connect your tools"
    : `${dateRangeLabels[dateRange]} · All sources`;

  return (
    <div className="flex h-screen bg-white">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main area */}
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Live Ticker */}
        <LiveTicker />

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#e5e5e5] px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-[#0a0a0a]">{headerTitle}</h1>
            <p className="text-[11px] text-[#a3a3a3]">{headerSub}</p>
          </div>
          {isOverview && (
            <div className="flex items-center gap-2">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <ExportMenu onToast={showToast} />
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {isOverview ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-5 space-y-5 max-w-[1400px]"
              >
                <KPIBar />
                <SourceTable />
                <div className="grid grid-cols-2 gap-3">
                  <RevenueChart />
                  <TrendChart />
                </div>
                <PipelineFunnel />
                <CampaignTables />
              </motion.div>
            ) : isIntegrations ? (
              <motion.div
                key="integrations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <IntegrationsPage />
              </motion.div>
            ) : isSettings ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsPage />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && <Toast key={toast} message={toast} onDone={clearToast} />}
      </AnimatePresence>
    </div>
  );
}
