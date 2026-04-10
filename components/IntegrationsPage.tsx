"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type GHLLocation = {
  location_id: string;
  location_name: string;
  status: string | null;
};

type Integration = {
  id: string;
  name: string;
  description: string;
  category: string;
  letter: string;
  bg: string;
  provider: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "ghl",
    provider: "ghl",
    name: "GoHighLevel",
    description: "Sync contacts, pipelines, and appointment data automatically.",
    category: "CRM",
    letter: "GHL",
    bg: "#0ea5e9",
  },
  {
    id: "hubspot",
    provider: "hubspot",
    name: "HubSpot",
    description: "Pull deal stages, contact records, and pipeline value.",
    category: "CRM",
    letter: "H",
    bg: "#ff7a59",
  },
  {
    id: "salesforce",
    provider: "salesforce",
    name: "Salesforce",
    description: "Import opportunity data and closed-won revenue by source.",
    category: "CRM",
    letter: "SF",
    bg: "#00a1e0",
  },
  {
    id: "facebook",
    provider: "facebook",
    name: "Facebook Ads",
    description: "Ingest campaign spend, impressions, and lead form data.",
    category: "Advertising",
    letter: "f",
    bg: "#1877f2",
  },
  {
    id: "google",
    provider: "google",
    name: "Google Ads",
    description: "Track conversions, spend, and keyword-level CPL in real time.",
    category: "Advertising",
    letter: "G",
    bg: "#4285f4",
  },
  {
    id: "jobber",
    provider: "jobber",
    name: "Jobber",
    description: "Sync scheduled jobs, invoices, and customer lifetime value.",
    category: "Field Service",
    letter: "J",
    bg: "#6fbd44",
  },
];

const CATEGORIES = ["CRM", "Advertising", "Field Service"];

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [loadingConnected, setLoadingConnected] = useState(true);
  const [ghlLocations, setGhlLocations] = useState<GHLLocation[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user?.user_metadata?.org_id) { setLoadingConnected(false); return; }

      const orgId = user.user_metadata.org_id;

      const [integrationsRes, locationsRes] = await Promise.all([
        supabase
          .from("integrations")
          .select("provider")
          .eq("org_id", orgId)
          .eq("status", "active"),
        supabase
          .from("ghl_locations")
          .select("location_id, location_name, status")
          .eq("org_id", orgId)
          .order("location_name", { ascending: true }),
      ]);

      if (integrationsRes.data) {
        setConnected(new Set(integrationsRes.data.map((r: { provider: string }) => r.provider)));
      }
      if (locationsRes.data) setGhlLocations(locationsRes.data);
      setLoadingConnected(false);
    }
    load();
  }, []);

  const connectedCount = connected.size;

  async function handleDisconnect(provider: string) {
    await fetch(`/api/integrations/${provider}/disconnect`, { method: "POST" });
    setConnected((prev) => {
      const next = new Set(prev);
      next.delete(provider);
      return next;
    });
  }

  return (
    <div className="px-6 py-5 max-w-[900px]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-base font-semibold text-[#0a0a0a]">Integrations</h2>
        <p className="text-sm text-[#a3a3a3] mt-1 max-w-lg">
          Connect your CRM, advertising platforms, and field service tools to
          automatically sync lead, appointment, and revenue data into your dashboard.
        </p>
      </motion.div>

      {/* OAuth error banner */}
      {oauthError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-red-100 rounded-lg p-4 mb-6 flex items-center gap-3 bg-red-50"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <circle cx="7" cy="7" r="5.5" stroke="#ef4444" strokeWidth="1.2" />
            <path d="M7 4v3.5M7 9.5v.5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <p className="text-xs text-red-600">
            {oauthError === "provider_not_configured"
              ? "This integration isn't configured yet. Add the API credentials to your environment variables."
              : "Connection failed. Please try again or contact support."}
          </p>
        </motion.div>
      )}

      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="border border-[#e5e5e5] rounded-lg p-4 mb-6 flex items-center gap-3 bg-[#fafafa]"
      >
        <div className="w-8 h-8 rounded-full bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="#a3a3a3" strokeWidth="1.2" />
            <path d="M7 4v3.5M7 9.5v.5" stroke="#a3a3a3" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          {loadingConnected ? (
            <p className="text-xs text-[#a3a3a3]">Loading connections…</p>
          ) : connectedCount === 0 ? (
            <>
              <p className="text-xs font-medium text-[#525252]">No integrations connected</p>
              <p className="text-[11px] text-[#a3a3a3]">
                You&apos;re viewing mock data. Connect a source below to pull your live numbers.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-[#525252]">
                {connectedCount} {connectedCount === 1 ? "integration" : "integrations"} connected
              </p>
              <p className="text-[11px] text-[#a3a3a3]">Your dashboard is syncing live data.</p>
            </>
          )}
        </div>
      </motion.div>

      {/* Grouped by category */}
      {CATEGORIES.map((cat) => {
        const items = INTEGRATIONS.filter((i) => i.category === cat);
        const startIndex = INTEGRATIONS.findIndex((i) => i.category === cat);
        return (
          <div key={cat} className="mb-6">
            <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-widest mb-3">
              {cat}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {items.map((item, j) => (
                <IntegrationCard
                  key={item.id}
                  item={item}
                  index={startIndex + j}
                  isConnected={connected.has(item.provider)}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* GHL sub-account locations — only shown when GHL agency is connected */}
      {connected.has("ghl") && ghlLocations.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-widest mb-1">
            GHL Locations
          </p>
          <p className="text-[11px] text-[#a3a3a3] mb-3">
            Connect each sub-account to pull live contacts, pipelines, and revenue.
          </p>
          <div className="border border-[#e5e5e5] rounded-lg overflow-hidden divide-y divide-[#e5e5e5]">
            {ghlLocations.map((loc) => {
              const isActive = loc.status === "active";
              return (
                <div key={loc.location_id} className="flex items-center justify-between px-4 py-3 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#0ea5e9] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      GHL
                    </div>
                    <span className="text-xs font-medium text-[#0a0a0a]">{loc.location_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Connected
                      </span>
                    ) : (
                      <a
                        href={`/api/integrations/loc/connect?locationId=${loc.location_id}`}
                        className="text-[11px] font-medium text-white bg-[#0a0a0a] px-3 py-1 rounded-md hover:bg-[#262626] transition-colors"
                      >
                        Connect
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-[11px] text-[#d4d4d4] text-center pt-2"
      >
        More integrations coming soon · Zapier, Webhooks, and CSV import
      </motion.p>
    </div>
  );
}

function IntegrationCard({
  item,
  index,
  isConnected,
  onDisconnect,
}: {
  item: Integration;
  index: number;
  isConnected: boolean;
  onDisconnect: (provider: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg p-4 flex flex-col gap-3 bg-white"
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{ backgroundColor: item.bg, opacity: isConnected ? 1 : 0.7 }}
        >
          {item.letter}
        </div>
        {isConnected ? (
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Connected
          </span>
        ) : (
          <span className="text-[10px] text-[#a3a3a3] border border-[#e5e5e5] px-2 py-0.5 rounded-full">
            {item.category}
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#525252]">{item.name}</p>
        <p className="text-[11px] text-[#a3a3a3] mt-0.5 leading-relaxed">{item.description}</p>
      </div>

      {isConnected ? (
        <button
          onClick={() => onDisconnect(item.provider)}
          className="w-full text-center text-[11px] font-medium text-red-500 border border-red-200 rounded-md py-1.5 hover:border-red-400 hover:text-red-600 transition-colors"
        >
          Disconnect
        </button>
      ) : (
        <a
          href={`/api/integrations/${item.provider}/connect`}
          className="w-full text-center text-[11px] font-medium text-white bg-[#0a0a0a] rounded-md py-1.5 hover:bg-[#262626] transition-colors"
        >
          Connect
        </a>
      )}
    </motion.div>
  );
}
