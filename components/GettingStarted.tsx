"use client";

import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const INTEGRATIONS = [
  {
    provider: "ghl",
    name: "GoHighLevel",
    description: "Sync contacts, pipelines, and appointment data.",
    letter: "GHL",
    bg: "#0ea5e9",
  },
  {
    provider: "hubspot",
    name: "HubSpot",
    description: "Pull deal stages, contacts, and pipeline value.",
    letter: "H",
    bg: "#ff7a59",
  },
  {
    provider: "salesforce",
    name: "Salesforce",
    description: "Import opportunity data and closed-won revenue.",
    letter: "SF",
    bg: "#00a1e0",
  },
  {
    provider: "facebook",
    name: "Facebook Ads",
    description: "Ingest campaign spend, impressions, and lead data.",
    letter: "f",
    bg: "#1877f2",
  },
  {
    provider: "google",
    name: "Google Ads",
    description: "Track conversions, spend, and keyword-level CPL.",
    letter: "G",
    bg: "#4285f4",
  },
  {
    provider: "jobber",
    name: "Jobber",
    description: "Sync jobs, invoices, and customer lifetime value.",
    letter: "J",
    bg: "#6fbd44",
  },
];

export default function GettingStarted() {
  return (
    <div className="px-6 py-10 max-w-[860px]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="mb-8"
      >
        <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-widest mb-2">
          Get started
        </p>
        <h2 className="text-lg font-semibold text-[#0a0a0a] mb-1.5">
          Connect your first data source
        </h2>
        <p className="text-sm text-[#a3a3a3] max-w-md">
          You&apos;re currently viewing demo data. Connect a CRM, ad platform,
          or field service tool to pull your real numbers into the dashboard.
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {INTEGRATIONS.map((item, i) => (
          <motion.div
            key={item.provider}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.06, ease: EASE }}
            className="border border-[#e5e5e5] rounded-lg p-4 flex flex-col gap-3 bg-white"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0"
              style={{ backgroundColor: item.bg }}
            >
              {item.letter}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-[#0a0a0a]">{item.name}</p>
              <p className="text-[11px] text-[#a3a3a3] mt-0.5 leading-relaxed">
                {item.description}
              </p>
            </div>

            <a
              href={`/api/integrations/${item.provider}/connect`}
              className="w-full text-center text-[11px] font-medium text-white bg-[#0a0a0a] rounded-md py-1.5 hover:bg-[#262626] transition-colors"
            >
              Connect
            </a>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-[11px] text-[#d4d4d4] text-center mt-8"
      >
        More integrations coming soon · Zapier, Webhooks, and CSV import
      </motion.p>
    </div>
  );
}
