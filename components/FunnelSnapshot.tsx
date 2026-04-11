"use client";

// FunnelSnapshot — shows the core med spa funnel: Lead → Booked → Showed → Paid.
// Replaces SourceTable on the dashboard. This is the primary product visualization
// for the agency's client deliverable: every stage maps directly to a business action.
//
// Data sources:
//   Leads    → GHL contacts count (all-time or date-filtered)
//   Booked   → GHL calendar events count (calendars.readonly scope required)
//   Showed   → appointment_confirmations table (med spa owner confirms via report page)
//   Paid     → GHL won opportunities count (closed-won)
//
// The component degrades gracefully: stages with 0 data show "—" and the conversion
// arrows show "N/A" rather than crashing or showing misleading 0%.

import { motion } from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import { mockFunnel } from "@/lib/mock-data";
import type { GHLSyncResponse } from "@/lib/ghl/types";
import type { MetaInsightsResponse } from "@/app/api/meta/insights/route";
import { Badge } from "@/components/ui/badge";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function conversionRate(from: number, to: number): string | null {
  if (from === 0) return null;
  return `${Math.round((to / from) * 100)}%`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

type StageProps = {
  label: string;
  count: number | null; // null = no data yet
  rate?: string | null; // conversion rate to the next stage; omit for the last stage
  index: number;
};

// The badge sits inline to the right of the count, vertically centered with it.
function StageCard({ label, count, rate, index }: StageProps) {
  const hasData = count !== null && count > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      className="flex-1 min-w-0"
    >
      <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className={`text-3xl font-bold tracking-tight leading-none tabular-nums ${hasData ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
          {count !== null ? count.toLocaleString() : "—"}
        </p>
        {rate !== undefined && (
          <Badge variant="secondary" className="text-xs font-semibold">
            {rate ?? "—"}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonFunnel() {
  return (
    <div className="border border-[#e5e5e5] rounded-lg p-5">
      <div className="animate-pulse">
        <div className="h-3 w-32 bg-[#ebebeb] rounded mb-5" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1">
              <div className="h-2 w-12 bg-[#ebebeb] rounded mb-2" />
              <div className="h-8 w-16 bg-[#ebebeb] rounded mb-1" />
              <div className="h-2 w-20 bg-[#ebebeb] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Guarantee badge ───────────────────────────────────────────────────────────
// Shows progress toward the 30-day guarantee in demo mode.
// The agency guarantees 15 high-ticket sales in 30 days — this keeps it visible.

function GuaranteeBadge({ paid, target, daysElapsed, daysTotal }: {
  paid: number; target: number; daysElapsed: number; daysTotal: number;
}) {
  const pct = Math.min((paid / target) * 100, 100);
  const daysLeft = daysTotal - daysElapsed;
  const onTrack = paid / daysElapsed >= target / daysTotal;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#fafafa] border border-[#e5e5e5]">
      <div className="flex-1">
        <p className="text-[11px] font-semibold text-[#0a0a0a]">
          {paid} / {target} guaranteed sales
        </p>
        <div className="h-1 bg-[#ebebeb] rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : onTrack ? "bg-green-500" : "bg-amber-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className={`text-[11px] font-medium shrink-0 ${onTrack ? "text-green-700" : "text-amber-600"}`}>
        {daysLeft}d left
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type FunnelSnapshotProps = {
  ghlData?: GHLSyncResponse | null;
  metaData?: MetaInsightsResponse | null;
  loading?: boolean;
};

export default function FunnelSnapshot({ ghlData, metaData, loading }: FunnelSnapshotProps) {
  const demo = useDemoMode();

  if (!demo && loading) return <SkeletonFunnel />;

  // ── Demo mode ─────────────────────────────────────────────────────────────
  if (demo) {
    const { leads, booked, showed, paid, spend, guaranteeTarget, daysElapsed, daysTotal } = mockFunnel;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
        className="border border-[#e5e5e5] rounded-lg p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0a0a0a]">Funnel Overview</h2>
          <span className="text-[11px] text-[#a3a3a3]">{fmtMoney(spend)} ad spend</span>
        </div>

        {/* Funnel stages */}
        <div className="flex items-center">
          <StageCard label="Leads"  count={leads}                                          index={0} />
          <StageCard label="Booked" count={booked} rate={conversionRate(leads, booked)}  index={1} />
          <StageCard label="Showed" count={showed} rate={conversionRate(booked, showed)} index={2} />
          <StageCard label="Paid"   count={paid}   rate={conversionRate(showed, paid)}   index={3} />
        </div>

        {/* Guarantee progress */}
        <GuaranteeBadge
          paid={paid}
          target={guaranteeTarget}
          daysElapsed={daysElapsed}
          daysTotal={daysTotal}
        />
      </motion.div>
    );
  }

  // ── Live mode ─────────────────────────────────────────────────────────────
  const leads   = ghlData?.contacts ?? 0;
  const booked  = ghlData?.bookedCount ?? 0;
  const showed  = ghlData?.showedCount ?? 0;
  const paid    = ghlData?.wonCount ?? 0;
  const spend   = metaData?.totals.spend ?? 0;

  // If no GHL data yet, show a helpful placeholder rather than all zeros
  if (!ghlData) {
    return (
      <div className="border border-[#e5e5e5] rounded-lg p-5">
        <h2 className="text-sm font-semibold text-[#0a0a0a] mb-1">Funnel Overview</h2>
        <p className="text-sm text-[#d4d4d4]">Connect GHL to see your funnel data.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
      className="border border-[#e5e5e5] rounded-lg p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0a0a0a]">Funnel Overview</h2>
        {spend > 0 && (
          <span className="text-[11px] text-[#a3a3a3]">{fmtMoney(spend)} ad spend</span>
        )}
      </div>

      <div className="flex items-center">
        <StageCard label="Leads"  count={leads > 0 ? leads : null}                                                               index={0} />
        <StageCard label="Booked" count={booked > 0 ? booked : null}  rate={booked > 0 ? conversionRate(leads, booked) : null}  index={1} />
        <StageCard label="Showed" count={showed > 0 ? showed : null}  rate={showed > 0 ? conversionRate(booked, showed) : null} index={2} />
        <StageCard label="Paid"   count={paid > 0 ? paid : null}      rate={paid > 0 ? conversionRate(showed, paid) : null}    index={3} />
      </div>

      {/* Note explaining empty stages */}
      {(booked === 0 || showed === 0) && (
        <p className="text-[11px] text-[#d4d4d4]">
          {booked === 0 && "Booked: add calendars.readonly scope to GHL sub-account app. "}
          {showed === 0 && "Showed: med spa owner confirms via client report link."}
        </p>
      )}
    </motion.div>
  );
}
