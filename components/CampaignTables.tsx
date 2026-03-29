"use client";

import { motion } from "framer-motion";
import { campaignBreakdown, Campaign } from "@/lib/mock-data";

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function ROASBadge({ value }: { value: number }) {
  const color =
    value >= 3
      ? "text-green-700 bg-green-50"
      : value >= 1
      ? "text-amber-700 bg-amber-50"
      : "text-red-600 bg-red-50";
  return (
    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${color}`}>
      {value.toFixed(1)}x
    </span>
  );
}

function CampaignTable({
  title,
  campaigns,
  accentColor,
}: {
  title: string;
  campaigns: Campaign[];
  accentColor: string;
}) {
  return (
    <div className="flex-1 min-w-0 border border-[#e5e5e5] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e5e5e5] flex items-center gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <h3 className="text-sm font-semibold text-[#0a0a0a]">{title}</h3>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#e5e5e5]">
            <th className="px-4 py-2.5 text-left font-medium text-[#a3a3a3]">
              Campaign
            </th>
            <th className="px-4 py-2.5 text-right font-medium text-[#a3a3a3]">
              Leads
            </th>
            <th className="px-4 py-2.5 text-right font-medium text-[#a3a3a3]">
              Spend
            </th>
            <th className="px-4 py-2.5 text-right font-medium text-[#a3a3a3]">
              CPL
            </th>
            <th className="px-4 py-2.5 text-right font-medium text-[#a3a3a3]">
              Revenue
            </th>
            <th className="px-4 py-2.5 text-right font-medium text-[#a3a3a3]">
              ROAS
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c, i) => {
            const cpl = c.leads > 0 ? c.spend / c.leads : 0;
            const roas = c.spend > 0 ? c.revenue / c.spend : 0;
            return (
              <tr
                key={c.name}
                className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors last:border-0"
              >
                <td className="px-4 py-2.5 text-[#0a0a0a] font-medium max-w-[180px] truncate">
                  {c.name}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[#0a0a0a]">
                  {c.leads}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[#525252]">
                  {fmtMoney(c.spend)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[#525252]">
                  {fmtMoney(cpl)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-green-700 font-medium">
                  {fmtMoney(c.revenue)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <ROASBadge value={roas} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CampaignTables() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.7, ease: "easeOut" }}
    >
      <h2 className="text-sm font-semibold text-[#0a0a0a] mb-3">
        Campaign Breakdown
      </h2>
      <div className="flex gap-3">
        <CampaignTable
          title="Google Ads"
          campaigns={campaignBreakdown.google}
          accentColor="#4285F4"
        />
        <CampaignTable
          title="Facebook Ads"
          campaigns={campaignBreakdown.facebook}
          accentColor="#1877F2"
        />
      </div>
    </motion.div>
  );
}
