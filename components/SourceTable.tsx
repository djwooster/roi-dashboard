"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import { leadSources, getCPL, getCostPerAppt, getROAS, getROI } from "@/lib/mock-data";
import type { MetaInsightsResponse } from "@/app/api/meta/insights/route";

// ── Shared ────────────────────────────────────────────────────────────────────

const SOURCES = [
  { id: "google", name: "Google Ads", color: "#4285f4" },
  { id: "facebook", name: "Facebook Ads", color: "#1877f2" },
  { id: "ghl", name: "GoHighLevel", color: "#0ea5e9" },
  { id: "hubspot", name: "HubSpot", color: "#ff7a59" },
  { id: "salesforce", name: "Salesforce", color: "#00a1e0" },
  { id: "jobber", name: "Jobber", color: "#6fbd44" },
];

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// ── Demo table ────────────────────────────────────────────────────────────────

type SortKey = "name" | "leads" | "spend" | "cpl" | "appointments" | "costPerAppt" | "revenue" | "roas" | "roi";
type SortDir = "asc" | "desc";

function ROASBadge({ value }: { value: number }) {
  const color = value >= 3 ? "text-green-700 bg-green-50" : value >= 1 ? "text-amber-700 bg-amber-50" : "text-red-600 bg-red-50";
  return <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${color}`}>{value.toFixed(1)}x</span>;
}

function DemoSourceTable({ onSelectSource, selectedSource }: { onSelectSource?: (id: string | null) => void; selectedSource?: string | null }) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...leadSources].sort((a, b) => {
    let av: number | string = 0, bv: number | string = 0;
    switch (sortKey) {
      case "name": av = a.name; bv = b.name; break;
      case "leads": av = a.leads; bv = b.leads; break;
      case "spend": av = a.spend; bv = b.spend; break;
      case "cpl": av = getCPL(a); bv = getCPL(b); break;
      case "appointments": av = a.appointments; bv = b.appointments; break;
      case "costPerAppt": av = getCostPerAppt(a); bv = getCostPerAppt(b); break;
      case "revenue": av = a.closedRevenue; bv = b.closedRevenue; break;
      case "roas": av = getROAS(a); bv = getROAS(b); break;
      case "roi": av = getROI(a); bv = getROI(b); break;
    }
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const cols: { key: SortKey; label: string; align: "left" | "right" }[] = [
    { key: "name", label: "Source", align: "left" },
    { key: "leads", label: "Leads", align: "right" },
    { key: "spend", label: "Spend", align: "right" },
    { key: "cpl", label: "CPL", align: "right" },
    { key: "appointments", label: "Appts", align: "right" },
    { key: "costPerAppt", label: "Cost/Appt", align: "right" },
    { key: "revenue", label: "Revenue", align: "right" },
    { key: "roas", label: "ROAS", align: "right" },
    { key: "roi", label: "ROI %", align: "right" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[#e5e5e5]">
        <h2 className="text-sm font-semibold text-[#0a0a0a]">Lead Source Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              {cols.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)}
                  className={`px-4 py-2.5 font-medium text-[#a3a3a3] cursor-pointer select-none whitespace-nowrap hover:text-[#0a0a0a] transition-colors ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  {col.label}
                  {sortKey === col.key && <span className="ml-1 text-[#525252]">{sortDir === "asc" ? "↑" : "↓"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((source) => {
              const cpl = getCPL(source);
              const costPerAppt = getCostPerAppt(source);
              const roas = getROAS(source);
              const roi = getROI(source);
              const isSelected = selectedSource === source.id;
              return (
                <tr
                  key={source.id}
                  onClick={() => onSelectSource?.(isSelected ? null : source.id)}
                  className={`border-b border-[#f5f5f5] last:border-0 transition-colors ${onSelectSource ? "cursor-pointer" : ""} ${isSelected ? "bg-[#f5f5f5]" : "hover:bg-[#fafafa]"}`}
                >
                  <td className="px-4 py-2.5 font-medium text-[#0a0a0a] whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                      {source.name}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#0a0a0a]">{source.leads.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#525252]">{fmtMoney(source.spend)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#525252]">{fmtMoney(cpl)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#0a0a0a]">{source.appointments}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#525252]">{fmtMoney(costPerAppt)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-green-700 font-medium">{fmtMoney(source.closedRevenue)}</td>
                  <td className="px-4 py-2.5 text-right"><ROASBadge value={roas} /></td>
                  <td className="px-4 py-2.5 text-right font-mono text-green-700">{roi.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── Empty table ───────────────────────────────────────────────────────────────

const COLS = ["Leads", "Spend", "CPL", "Appts", "Cost/Appt", "Revenue", "ROAS", "ROI %"];

type MetaSummary = { spend: number; impressions: number; clicks: number; leads: number } | null;

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function EmptySourceTable({ meta, onSelectSource, selectedSource }: { meta?: MetaSummary; onSelectSource?: (id: string | null) => void; selectedSource?: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[#e5e5e5]">
        <h2 className="text-sm font-semibold text-[#0a0a0a]">Lead Source Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="px-4 py-2.5 font-medium text-[#a3a3a3] text-left">Source</th>
              {COLS.map((col) => (
                <th key={col} className="px-4 py-2.5 font-medium text-[#a3a3a3] text-right whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((source) => {
              const isSelected = selectedSource === source.id;
              const isFacebook = source.id === "facebook";
              const cells: (string | null)[] = isFacebook && meta
                ? [
                    meta.leads > 0 ? meta.leads.toLocaleString() : null,
                    fmt(meta.spend),
                    meta.leads > 0 ? fmt(meta.spend / meta.leads) : null,
                    null, // Appts
                    null, // Cost/Appt
                    null, // Revenue
                    null, // ROAS
                    null, // ROI %
                  ]
                : COLS.map(() => null);

              return (
                <tr
                  key={source.id}
                  onClick={() => onSelectSource?.(isSelected ? null : source.id)}
                  className={`border-b border-[#f5f5f5] last:border-0 transition-colors ${onSelectSource ? "cursor-pointer" : ""} ${isSelected ? "bg-[#f5f5f5]" : "hover:bg-[#fafafa]"}`}
                >
                  <td className="px-4 py-2.5 font-medium text-[#0a0a0a] whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                      {source.name}
                    </div>
                  </td>
                  {cells.map((val, i) => (
                    <td key={COLS[i]} className={`px-4 py-2.5 text-right font-mono ${val ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
                      {val ?? "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

type TableProps = {
  metaData?: MetaInsightsResponse | null;
  onSelectSource?: (id: string | null) => void;
  selectedSource?: string | null;
};

export default function SourceTable({ metaData, onSelectSource, selectedSource }: TableProps) {
  const demo = useDemoMode();
  if (demo) return <DemoSourceTable onSelectSource={onSelectSource} selectedSource={selectedSource} />;

  // Aggregate Meta totals across all accounts for the Facebook Ads row
  const meta = metaData
    ? {
        spend: metaData.totals.spend,
        impressions: metaData.totals.impressions,
        clicks: metaData.totals.clicks,
        leads: metaData.totals.leads,
      }
    : null;

  return <EmptySourceTable meta={meta} onSelectSource={onSelectSource} selectedSource={selectedSource} />;
}
