"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import KPIBar from "@/components/KPIBar";
import SourceTable from "@/components/SourceTable";
// RevenueChart and TrendChart removed — replaced by KPI cards + table layout
// import RevenueChart from "@/components/RevenueChart";
// import TrendChart from "@/components/TrendChart";
// PipelineFunnel commented out — will revisit once per-location data is flowing
// import PipelineFunnel from "@/components/PipelineFunnel";
import CampaignTables from "@/components/CampaignTables";
import PipelineLeaderboard from "@/components/PipelineLeaderboard";
import LiveTicker from "@/components/LiveTicker";
import IntegrationsPage from "@/components/IntegrationsPage";
import SettingsPage from "@/components/SettingsPage";
import SourceDrawer from "@/components/SourceDrawer";
import ClientSwitcher, { type GHLLocation } from "@/components/ClientSwitcher";
import DateRangePicker, { type DateRange } from "@/components/DateRangePicker";
import { createClient } from "@/lib/supabase/client";
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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-[var(--color-brand)] text-white text-xs font-medium px-4 py-2.5 rounded-lg"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.2" />
        <path d="M4 6.5l2 2 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </motion.div>
  );
}

// ── Share link button ─────────────────────────────────────────────────────────
function ShareLinkButton({ onToast }: { onToast: (msg: string) => void }) {
  async function handleClick() {
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
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-[11px] font-medium text-white bg-[#0a0a0a] px-3 py-1.5 rounded-md hover:bg-[#262626] transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M5 6.5a2.5 2.5 0 003.54 0l1-1a2.5 2.5 0 00-3.54-3.54L5.5 2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M7 5.5a2.5 2.5 0 00-3.54 0l-1 1a2.5 2.5 0 003.54 3.54L6.5 9.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      Share link
    </button>
  );
}

// Maps a DateRange label to the period_label stored in the metrics table.
// Module-level (not inside the component) so it's not redefined on every render.
function toPeriodLabel(range: DateRange): string {
  if (!range) return "all_time";
  switch (range.label) {
    case "Today":        return "today";
    case "Last 7 days":  return "7d";
    case "Last 30 days": return "30d";
    case "Last 90 days": return "90d";
    default:             return "all_time";
  }
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

  // Agency client switcher state
  const [locations, setLocations] = useState<GHLLocation[]>([]);
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string | null>(null);

  // Date range picker — default to last 30 days so the dashboard shows recent activity
  // rather than potentially years of all-time data on first load.
  const [dateRange, setDateRange] = useState<DateRange>({ label: "Last 30 days", from: (() => {
    const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10);
  })(), to: new Date().toISOString().slice(0, 10) });

  // Fetch GHL data for the given location + date range.
  // Extracted into a callback so it can be called both on mount and on switcher/picker change.
  const fetchGHL = useCallback(async (locationId: string | null, range: DateRange) => {
    setGhlData(null);
    const params = new URLSearchParams();
    if (locationId) params.set("locationId", locationId);
    if (range?.from) params.set("from", range.from);
    if (range?.to) params.set("to", range.to);
    // Pass the period label so the sync route can serve from cache when available.
    // The live GHL call (using from/to) is the fallback if cache is missing or stale.
    params.set("period", toPeriodLabel(range));
    const qs = params.toString();
    const url = `/api/ghl/sync${qs ? `?${qs}` : ""}`;
    try {
      const r = await fetch(url);
      if (r.ok) setGhlData(await r.json());
    } catch { /* GHL not connected or API error — dashboard shows "—" */ }
  }, []);

  // Initial load: resolve locations first, then fetch data in parallel.
  // We load locations from Supabase client-side (this is a "use client" component)
  // rather than adding another API route — the data is non-sensitive and RLS-scoped.
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Resolve GHL locations for the client switcher.
      const supabase = createClient();
      const { data: locs } = await supabase
        .from("ghl_locations")
        .select("location_id, location_name")
        .order("created_at", { ascending: true });

      let resolvedLocationId: string | null = null;
      if (locs && locs.length > 0) {
        setLocations(locs);
        resolvedLocationId = locs[0].location_id;
        setCurrentLocationId(resolvedLocationId);
        setCurrentLocationName(locs[0].location_name);
      }

      // Fetch Meta and GHL in parallel — GHL uses the resolved location (or falls
      // back server-side to provider_user_id for single-location accounts).
      const metaP = fetch("/api/meta/insights")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setMetaData(data); })
        .catch(() => {});

      await Promise.allSettled([metaP, fetchGHL(resolvedLocationId, dateRange)]);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch GHL data when the user switches client or changes the date range.
  // We skip this on the initial render (handled above) using a ref so we don't
  // double-fetch on mount.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchGHL(currentLocationId, dateRange);
  }, [currentLocationId, dateRange, fetchGHL]);

  const demo = useDemoMode();
  const showToast = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(null), []);

  const isOverview = currentPage === "overview";
  const isIntegrations = currentPage === "integrations";
  const isSettings = currentPage === "settings";
  const headerTitle = isSettings ? "Settings" : isIntegrations ? "Integrations" : "Dashboard";
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
              {/* Client switcher — only visible when 2+ GHL locations exist (agency mode) */}
              <ClientSwitcher
                locations={locations}
                currentId={currentLocationId}
                currentName={currentLocationName}
                onSelect={(id, name) => {
                  setCurrentLocationId(id);
                  setCurrentLocationName(name);
                }}
              />
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <ShareLinkButton onToast={showToast} />
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
                {/* PipelineFunnel commented out — re-enable once per-location data flows */}
                {/* <PipelineFunnel pipelines={ghlData?.pipelines ?? []} loading={loading} /> */}
                <PipelineLeaderboard pipelines={ghlData?.pipelines ?? []} loading={loading} />
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
