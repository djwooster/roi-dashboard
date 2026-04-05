"use client";

import { motion } from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import { campaignBreakdown, Campaign } from "@/lib/mock-data";

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function ROASBadge({ value }: { value: number }) {
  const color = value >= 3 ? "text-green-700 bg-green-50" : value >= 1 ? "text-amber-700 bg-amber-50" : "text-red-600 bg-red-50";
  return <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${color}`}>{value.toFixed(1)}x</span>;
}

const COLS = ["Leads", "Spend", "CPL", "Revenue", "ROAS"];
const PLACEHOLDER_ROWS = 3;

function CampaignTable({
  title,
  campaigns,
  accentColor,
  demo,
}: {
  title: string;
  campaigns: Campaign[];
  accentColor: string;
  demo: boolean;
}) {
  return (
    <div className="flex-1 min-w-0 border border-[#e5e5e5] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e5e5e5] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
        <h3 className="text-sm font-semibold text-[#0a0a0a]">{title}</h3>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#e5e5e5]">
            <th className="px-4 py-2.5 text-left font-medium text-[#a3a3a3]">Campaign</th>
            {COLS.map((col) => (
              <th key={col} className="px-4 py-2.5 text-right font-medium text-[#a3a3a3]">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {demo
            ? campaigns.map((c) => {
                const cpl = c.leads > 0 ? c.spend / c.leads : 0;
                const roas = c.spend > 0 ? c.revenue / c.spend : 0;
                return (
                  <tr key={c.name} className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors last:border-0">
                    <td className="px-4 py-2.5 text-[#0a0a0a] font-medium max-w-[180px] truncate">{c.name}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#0a0a0a]">{c.leads}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#525252]">{fmtMoney(c.spend)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#525252]">{fmtMoney(cpl)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-green-700 font-medium">{fmtMoney(c.revenue)}</td>
                    <td className="px-4 py-2.5 text-right"><ROASBadge value={roas} /></td>
                  </tr>
                );
              })
            : Array.from({ length: PLACEHOLDER_ROWS }).map((_, i) => (
                <tr key={i} className="border-b border-[#f5f5f5] last:border-0">
                  <td className="px-4 py-2.5 font-mono text-[#d4d4d4]">—</td>
                  {COLS.map((col) => (
                    <td key={col} className="px-4 py-2.5 text-right font-mono text-[#d4d4d4]">—</td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CampaignTables() {
  const demo = useDemoMode();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.7, ease: "easeOut" }}
    >
      <h2 className="text-sm font-semibold text-[#0a0a0a] mb-3">Campaign Breakdown</h2>
      <div className="flex gap-3">
        <CampaignTable title="Google Ads" campaigns={campaignBreakdown.google} accentColor="#4285F4" demo={demo} />
        <CampaignTable title="Facebook Ads" campaigns={campaignBreakdown.facebook} accentColor="#1877F2" demo={demo} />
      </div>
    </motion.div>
  );
}
