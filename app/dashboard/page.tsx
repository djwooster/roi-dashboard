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
import SourceDrawer from "@/components/SourceDrawer";
import { leadSources } from "@/lib/mock-data";
import { useDemoMode } from "@/lib/demo-context";
import type { MetaInsightsResponse } from "@/app/api/meta/insights/route";
import type { GHLSyncResponse } from "@/app/api/ghl/sync/route";

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
      action: async () => {
        setOpen(false);
        // Create (or retrieve existing) report URL, then copy to clipboard.
        // The API upserts so repeated clicks always return the same persistent URL.
        try {
          const res = await fetch("/api/reports/create", { method: "POST" });
          const data = await res.json();
          if (data.url) {
            await navigator.clipboard.writeText(data.url);
            onToast("Report link copied — share it with your client!");
          } else {
            onToast(data.error ?? "GHL must be connected to generate a report.");
          }
        } catch {
          onToast("Could not generate report link. Please try again.");
        }
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

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<string>("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSelectSource(id: string | null) {
    setSelectedSource(id);
    setDrawerOpen(id !== null);
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setSelectedSource(null), 300);
  }

  const selectedSourceObj = selectedSource
    ? leadSources.find((s) => s.id === selectedSource) ?? null
    : null;
  const [metaData, setMetaData] = useState<MetaInsightsResponse | null>(null);
  const [ghlData, setGhlData] = useState<GHLSyncResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const metaP = fetch("/api/meta/insights")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setMetaData(data); })
      .catch(() => {});

    const ghlP = fetch("/api/ghl/sync")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setGhlData(data); })
      .catch(() => {});

    Promise.allSettled([metaP, ghlP]).then(() => setLoading(false));
  }, []);

  const demo = useDemoMode();
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
    : "All sources";

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
                <KPIBar metaData={metaData} ghlData={ghlData} loading={loading} />
                <SourceTable metaData={metaData} ghlData={ghlData} loading={loading} onSelectSource={demo ? handleSelectSource : undefined} selectedSource={demo ? selectedSource : null} />
                <div className="grid grid-cols-2 gap-3">
                  <RevenueChart />
                  <TrendChart />
                </div>
                <PipelineFunnel pipelines={ghlData?.pipelines ?? []} loading={loading} />
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

      {/* Backdrop when drawer is open */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseDrawer}
            className="fixed top-0 left-[220px] right-[400px] bottom-0 bg-black/5 backdrop-blur-[2px] z-20"
          />
        )}
      </AnimatePresence>

      {/* Drill-down drawer (demo mode only — real data drill-down coming soon) */}
      <AnimatePresence>
        {drawerOpen && selectedSourceObj && (
          <SourceDrawer key="source-drawer" source={selectedSourceObj} onClose={handleCloseDrawer} />
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && <Toast key={toast} message={toast} onDone={clearToast} />}
      </AnimatePresence>
    </div>
  );
}
