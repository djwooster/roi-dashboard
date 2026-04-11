"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import { campaignBreakdown } from "@/lib/mock-data";
import type { MetaCampaignsResponse, MetaCampaign } from "@/app/api/meta/campaigns/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// ROAS thresholds calibrated to med spa lead gen (high-ticket offers):
// ≥ 3x = healthy, 1–3x = marginal, < 1x = burning money
function ROASBadge({ value }: { value: number }) {
  const cls =
    value >= 3
      ? "text-green-700 bg-green-50 border border-green-100"
      : value >= 1
      ? "text-amber-700 bg-amber-50 border border-amber-100"
      : "text-red-600 bg-red-50 border border-red-100";
  return (
    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${cls}`}>
      {value > 0 ? `${value.toFixed(1)}x` : "—"}
    </span>
  );
}

const COLS = ["Leads", "Spend", "CPL", "Revenue", "ROAS"] as const;
const SKELETON_ROWS = 4;

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-[#f5f5f5] last:border-0">
      <td className="px-4 py-2.5">
        <div className="h-3 w-36 bg-[#f0f0f0] rounded animate-pulse" />
      </td>
      {COLS.map((c) => (
        <td key={c} className="px-4 py-2.5 text-right">
          <div className="h-3 w-10 bg-[#f0f0f0] rounded animate-pulse ml-auto" />
        </td>
      ))}
    </tr>
  );
}

// ── Data row ──────────────────────────────────────────────────────────────────
function CampaignRow({ campaign }: { campaign: MetaCampaign }) {
  return (
    <tr className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors last:border-0">
      <td className="px-4 py-2.5 text-xs text-[#0a0a0a] font-medium max-w-[220px] truncate">
        {campaign.name}
      </td>
      <td className="px-4 py-2.5 text-right text-xs font-mono text-[#0a0a0a]">
        {campaign.leads > 0 ? campaign.leads : "—"}
      </td>
      <td className="px-4 py-2.5 text-right text-xs font-mono text-[#525252]">
        {campaign.spend > 0 ? fmtMoney(campaign.spend) : "—"}
      </td>
      <td className="px-4 py-2.5 text-right text-xs font-mono text-[#525252]">
        {campaign.cpl > 0 ? fmtMoney(campaign.cpl) : "—"}
      </td>
      <td className="px-4 py-2.5 text-right text-xs font-mono text-green-700 font-medium">
        {campaign.revenue > 0 ? fmtMoney(campaign.revenue) : "—"}
      </td>
      <td className="px-4 py-2.5 text-right">
        <ROASBadge value={campaign.roas} />
      </td>
    </tr>
  );
}

// ── Empty placeholder (live mode, no Meta connected) ─────────────────────────
function PlaceholderRow() {
  return (
    <tr className="border-b border-[#f5f5f5] last:border-0">
      <td className="px-4 py-2.5 text-xs font-mono text-[#d4d4d4]">—</td>
      {COLS.map((c) => (
        <td key={c} className="px-4 py-2.5 text-right text-xs font-mono text-[#d4d4d4]">—</td>
      ))}
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// In demo mode: uses mock campaignBreakdown data from lib/mock-data.ts — never
// fetches live data so /demo always works as a standalone marketing tool.
// In live mode: fetches from /api/meta/campaigns on mount. Shows placeholder
// rows (instead of hiding the section) when Meta isn't connected — keeps the
// layout stable and signals to the user what data would appear here.
export default function TopCampaigns() {
  const demo = useDemoMode();
  const [data, setData] = useState<MetaCampaignsResponse | null>(null);
  const [loading, setLoading] = useState(!demo);

  useEffect(() => {
    // Demo path: mock data — skip the fetch entirely
    if (demo) return;

    fetch("/api/meta/campaigns")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setData(json as MetaCampaignsResponse);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [demo]);

  // Build the campaign list for the current render path
  const campaigns: MetaCampaign[] = demo
    ? campaignBreakdown.facebook.map((c) => ({
        name: c.name,
        spend: c.spend,
        leads: c.leads,
        revenue: c.revenue,
        cpl: c.leads > 0 ? c.spend / c.leads : 0,
        roas: c.spend > 0 ? c.revenue / c.spend : 0,
      }))
    : (data?.campaigns ?? []);

  const showPlaceholders = !demo && !loading && campaigns.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.7, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#0a0a0a]">Top Campaigns</h2>
        {!demo && !loading && campaigns.length === 0 && (
          <span className="text-[11px] text-[#a3a3a3]">
            Connect Facebook Ads to see campaign data
          </span>
        )}
      </div>

      <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
        {/* Header with Facebook Ads label */}
        <div className="px-4 py-3 border-b border-[#e5e5e5] flex items-center gap-2 bg-[#fafafa]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2]" />
          <span className="text-xs font-semibold text-[#0a0a0a]">Facebook Ads</span>
          {!loading && campaigns.length > 0 && (
            <span className="text-[11px] text-[#a3a3a3] ml-auto">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="px-4 py-2.5 text-left font-medium text-[#a3a3a3]">Campaign</th>
              {COLS.map((col) => (
                <th key={col} className="px-4 py-2.5 text-right font-medium text-[#a3a3a3]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => <SkeletonRow key={i} />)
              : showPlaceholders
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => <PlaceholderRow key={i} />)
              : campaigns.map((c) => <CampaignRow key={c.name} campaign={c} />)}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
