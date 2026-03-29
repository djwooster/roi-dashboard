"use client";

import { motion } from "framer-motion";

type Integration = {
  id: string;
  name: string;
  description: string;
  category: string;
  letter: string;
  bg: string;
  textColor: string;
};

const integrations: Integration[] = [
  {
    id: "ghl",
    name: "GoHighLevel",
    description: "Sync contacts, pipelines, and appointment data automatically.",
    category: "CRM",
    letter: "GHL",
    bg: "#0ea5e9",
    textColor: "#fff",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Pull deal stages, contact records, and pipeline value.",
    category: "CRM",
    letter: "H",
    bg: "#ff7a59",
    textColor: "#fff",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Import opportunity data and closed-won revenue by source.",
    category: "CRM",
    letter: "SF",
    bg: "#00a1e0",
    textColor: "#fff",
  },
  {
    id: "facebook",
    name: "Facebook Ads",
    description: "Ingest campaign spend, impressions, and lead form data.",
    category: "Advertising",
    letter: "f",
    bg: "#1877f2",
    textColor: "#fff",
  },
  {
    id: "google",
    name: "Google Ads",
    description: "Track conversions, spend, and keyword-level CPL in real time.",
    category: "Advertising",
    letter: "G",
    bg: "#4285f4",
    textColor: "#fff",
  },
  {
    id: "jobber",
    name: "Jobber",
    description: "Sync scheduled jobs, invoices, and customer lifetime value.",
    category: "Field Service",
    letter: "J",
    bg: "#6fbd44",
    textColor: "#fff",
  },
];

const categories = ["CRM", "Advertising", "Field Service"];

function IntegrationCard({ item, index }: { item: Integration; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg p-4 flex flex-col gap-3 bg-white"
    >
      {/* Logo */}
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 opacity-70"
          style={{ backgroundColor: item.bg, color: item.textColor }}
        >
          {item.letter}
        </div>
        <span className="text-[10px] text-[#a3a3a3] border border-[#e5e5e5] px-2 py-0.5 rounded-full">
          {item.category}
        </span>
      </div>

      {/* Info */}
      <div>
        <p className="text-sm font-semibold text-[#525252]">{item.name}</p>
        <p className="text-[11px] text-[#a3a3a3] mt-0.5 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Connect button */}
      <button
        disabled
        className="w-full text-[11px] font-medium text-[#a3a3a3] border border-[#e5e5e5] rounded-md py-1.5 cursor-not-allowed"
      >
        Connect
      </button>
    </motion.div>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="px-6 py-5 max-w-[900px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-base font-semibold text-[#0a0a0a]">Integrations</h2>
        <p className="text-sm text-[#a3a3a3] mt-1 max-w-lg">
          Connect your CRM, advertising platforms, and field service tools to
          automatically sync lead, appointment, and revenue data into this
          dashboard.
        </p>
      </motion.div>

      {/* Empty state banner */}
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
          <p className="text-xs font-medium text-[#525252]">No integrations connected</p>
          <p className="text-[11px] text-[#a3a3a3]">
            You&apos;re currently viewing mock data. Connect a source below to pull live numbers.
          </p>
        </div>
      </motion.div>

      {/* Grouped by category */}
      {categories.map((cat) => {
        const items = integrations.filter((i) => i.category === cat);
        const startIndex = integrations.findIndex((i) => i.category === cat);
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
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer note */}
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
