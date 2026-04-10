import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";
import { getValidLocationToken } from "@/lib/ghl/getValidLocationToken";
import { fetchLocationData } from "@/lib/ghl/fetchLocationData";
import { fetchAppointments, getAppointmentContactName, getAppointmentDate } from "@/lib/ghl/fetchAppointments";
import { generateReportSummary, type SummarySection } from "@/lib/ai/generateReportSummary";
import AppointmentConfirmList, { type AppointmentItem } from "@/components/AppointmentConfirmList";
import type { GHLPipelineData, GHLSyncResponse } from "@/lib/ghl/types";

// Public report page — no auth required.
// The token in the URL IS the access control: a 32-char random hex string that
// is unguessable. Agencies share this URL once with their client — it always
// shows live data, so they never need to resend it.
export const dynamic = "force-dynamic";

// Module-level so it's not reallocated on every request.
const SUMMARY_TTL_MS = 24 * 60 * 60 * 1000;

// ── Subcomponents ─────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[#a3a3a3] text-xs">Live</span>
    </span>
  );
}

// Compact funnel display used on the report page (vertical-friendly for mobile).
// The dashboard FunnelSnapshot uses the horizontal layout; this is purpose-built
// for the narrow mobile card design the agency sends to clients.
function ReportFunnel({ data }: { data: GHLSyncResponse }) {
  function convPct(from: number, to: number): string | null {
    if (from === 0) return null;
    return `${Math.round((to / from) * 100)}%`;
  }

  function fmtCount(n: number): string {
    return n > 0 ? n.toLocaleString() : "—";
  }

  const stages = [
    { label: "Leads",  value: data.contacts,    sub: "Total contacts" },
    { label: "Booked", value: data.bookedCount,  sub: "Appointments set" },
    { label: "Showed", value: data.showedCount,  sub: "Confirmed shows" },
    { label: "Paid",   value: data.wonCount,     sub: "High-ticket sales" },
  ];

  const conversions = [
    convPct(data.contacts, data.bookedCount),
    convPct(data.bookedCount, data.showedCount),
    convPct(data.showedCount, data.wonCount),
  ];

  const convLabels = ["Booking rate", "Show rate", "Close rate"];

  return (
    <div className="rounded-xl border border-[#e5e5e5] overflow-hidden">
      {/* Stage counts */}
      <div className="grid grid-cols-4 divide-x divide-[#e5e5e5]">
        {stages.map((s) => (
          <div key={s.label} className="p-4 text-center">
            <p className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-1">
              {s.label}
            </p>
            <p className={`text-2xl font-bold tracking-tight ${s.value > 0 ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
              {fmtCount(s.value)}
            </p>
            <p className="text-[10px] text-[#d4d4d4] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Conversion rates between stages */}
      <div className="grid grid-cols-3 divide-x divide-[#e5e5e5] border-t border-[#f0f0f0] bg-[#fafafa]">
        {conversions.map((rate, i) => (
          <div key={i} className="px-3 py-2 text-center">
            <p className={`text-sm font-semibold ${rate ? "text-[#0a0a0a]" : "text-[#d4d4d4]"}`}>
              {rate ?? "—"}
            </p>
            <p className="text-[10px] text-[#a3a3a3]">{convLabels[i]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelRow({ pipeline, rank }: { pipeline: GHLPipelineData; rank: number }) {
  const totalLeads = pipeline.stages[0]?.count ?? 0;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-[#f0f0f0] last:border-0">
      {/* Rank badge */}
      <div className="w-6 h-6 rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[11px] font-semibold text-[#a3a3a3]">{rank}</span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0a0a0a] truncate">{pipeline.pipelineName}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {pipeline.closeRate !== null && (
            <span className="text-xs text-[#525252]">
              <span className="font-semibold text-[#0a0a0a]">{pipeline.closeRate}%</span> close rate
            </span>
          )}
          {totalLeads > 0 && (
            <span className="text-xs text-[#a3a3a3]">{totalLeads} leads</span>
          )}
          {pipeline.wonRevenue > 0 && (
            <span className="text-xs text-[#a3a3a3]">${pipeline.wonRevenue.toLocaleString()} revenue</span>
          )}
        </div>

        {/* Mini funnel bar — each segment represents a stage, fading with position */}
        {pipeline.stages.length > 0 && totalLeads > 0 && (
          <div className="flex gap-0.5 mt-2">
            {pipeline.stages.map((stage, i) => {
              const pct = Math.round((stage.count / totalLeads) * 100);
              return (
                <div
                  key={i}
                  title={`${stage.name}: ${stage.count}`}
                  className="h-1 rounded-full bg-[#0a0a0a]"
                  style={{
                    width: `${Math.max(pct, 4)}%`,
                    opacity: 1 - i * (0.6 / pipeline.stages.length),
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Close rate callout */}
      {pipeline.closeRate !== null && (
        <div className="shrink-0 text-right">
          <span className="text-2xl font-bold text-[#0a0a0a]">{pipeline.closeRate}%</span>
        </div>
      )}
    </div>
  );
}

// Renders AI-generated summary sections — each with a bold heading and body copy.
// Falls back to a muted placeholder when the summary isn't available (no API key,
// generation failed, etc.) so the report page never hard-errors.
function AISummary({ sections }: { sections: SummarySection[] | null }) {
  const icon = (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.37 9.37l1.41 1.41M3.22 10.78l1.41-1.41M9.37 4.63l1.41-1.41"
        strokeWidth="1.2" strokeLinecap="round"
        stroke={sections && sections.length > 0 ? "#0a0a0a" : "#c4c4c4"}
      />
    </svg>
  );

  if (!sections || sections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e5e5e5] bg-[#fafafa] px-5 py-5">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-semibold text-[#c4c4c4] uppercase tracking-wide">AI Insights</span>
        </div>
        <p className="text-sm text-[#c4c4c4] leading-relaxed">
          Intelligent campaign analysis is coming soon — key trends, what&apos;s working,
          and what to watch, written in plain English.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-5 py-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wide">AI Insights</span>
      </div>
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i}>
            <p className="text-sm font-semibold text-[#0a0a0a] mb-0.5">{section.heading}</p>
            <p className="text-sm text-[#525252] leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  // Look up the report by token — 404 if the token is invalid or not found.
  // We also select the AI summary cache columns so we can avoid re-generating
  // within the 24h TTL.
  const { data: report } = await admin
    .from("reports")
    .select("org_id, agency_name, location_id, location_name, ai_summary, summary_generated_at")
    .eq("token", token)
    .single();

  if (!report) notFound();

  // Resolve the best available token for this location.
  // Sub-account token (if connected) has calendars.readonly for appointment fetching.
  // Falls back to company token for contacts + opportunities data.
  let ghlToken: string;
  try {
    const locationToken = await getValidLocationToken(report.org_id, report.location_id);
    ghlToken = locationToken ?? await getValidGHLToken(report.org_id);
  } catch {
    ghlToken = "";
  }

  // Fetch live GHL data — same shared function used by the dashboard sync route.
  let data: GHLSyncResponse | null = null;
  let dataError = false;

  try {
    if (ghlToken) {
      data = await fetchLocationData(report.location_id, ghlToken);
    } else {
      dataError = true;
    }
  } catch {
    dataError = true;
  }

  // ── Showed count from appointment_confirmations ────────────────────────────
  // Patch the showed count into the GHL data object. The table may not exist
  // yet (requires SQL migration) — Supabase returns an error row, not a throw.
  if (data) {
    try {
      const { count: showedCount } = await admin
        .from("appointment_confirmations")
        .select("*", { count: "exact", head: true })
        .eq("org_id", report.org_id)
        .eq("location_id", report.location_id)
        .eq("outcome", "showed");

      data = { ...data, showedCount: showedCount ?? 0 };
    } catch {
      // Table doesn't exist yet — showed stays 0
    }
  }

  // ── Appointment list for show/no-show confirmation UI ─────────────────────
  // Fetches the last 30 days of appointments from GHL, then merges with any
  // existing confirmations from our DB so the UI shows the current state.
  let appointmentItems: AppointmentItem[] = [];

  if (ghlToken) {
    try {
      const { appointments } = await fetchAppointments(report.location_id, ghlToken);

      // Fetch existing confirmations so the UI can show confirmed state on load
      const { data: existingConfirmations } = await admin
        .from("appointment_confirmations")
        .select("ghl_appointment_id, outcome")
        .eq("org_id", report.org_id)
        .eq("location_id", report.location_id);

      const confirmationMap = new Map(
        (existingConfirmations ?? []).map((c) => [c.ghl_appointment_id, c.outcome as "showed" | "no_show"])
      );

      // Convert GHL appointment objects to the shape AppointmentConfirmList expects.
      // Sort by appointment time descending so the most recent appear first.
      appointmentItems = appointments
        .map((appt) => ({
          id: appt.id,
          contactName: getAppointmentContactName(appt),
          appointmentAt: getAppointmentDate(appt).toISOString(),
          outcome: confirmationMap.get(appt.id) ?? null,
        }))
        .sort((a, b) => new Date(b.appointmentAt).getTime() - new Date(a.appointmentAt).getTime());
    } catch {
      // Appointments unavailable — omit the confirmation section
    }
  }

  // ── AI summary (cached 24h) ────────────────────────────────────────────────
  // We skip generation entirely when ANTHROPIC_API_KEY isn't set — this keeps
  // local dev and staging environments working without the key configured.
  // On failure (API error, bad JSON, etc.) we fall back to the placeholder
  // rather than breaking the page.
  let summarySections: SummarySection[] | null = null;

  if (data && process.env.ANTHROPIC_API_KEY) {
    const generatedAt = report.summary_generated_at
      ? new Date(report.summary_generated_at).getTime()
      : 0;
    const isFresh = report.ai_summary && Date.now() - generatedAt < SUMMARY_TTL_MS;

    if (isFresh) {
      // Serve from cache — no Anthropic call needed.
      try {
        summarySections = JSON.parse(report.ai_summary) as SummarySection[];
      } catch {
        // Corrupt cache — fall through to regenerate below
      }
    }

    if (!summarySections) {
      // Generate a fresh summary, then cache it asynchronously so the next
      // page view is instant. We don't await the write — a DB failure here
      // doesn't affect what the user sees.
      try {
        summarySections = await generateReportSummary(data, report.location_name ?? "Client");
        // Fire-and-forget cache write. Supabase's query builder is lazy — it only
        // executes on .then(), so we must trigger it explicitly without awaiting.
        (async () => {
          try {
            await admin
              .from("reports")
              .update({
                ai_summary: JSON.stringify(summarySections),
                summary_generated_at: new Date().toISOString(),
              })
              .eq("token", token);
          } catch {
            // Cache write failure is non-fatal — next visit will regenerate
          }
        })();
      } catch (err) {
        console.error("[report] summary failed:", err);
      }
    }
  }

  const monthYear = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 py-8 pb-16">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-widest mb-1">
            {report.agency_name || "Agency Report"}
          </p>
          <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight leading-tight">
            {report.location_name || "Client Report"}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-[#a3a3a3]">{monthYear}</span>
            <LiveDot />
          </div>
        </div>

        {/* AI Summary */}
        <div className="mb-8">
          <AISummary sections={summarySections} />
        </div>

        {dataError ? (
          <div className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] px-5 py-4 text-sm text-[#ef4444]">
            Unable to load report data at this time. Please check back shortly.
          </div>
        ) : data ? (
          <>
            {/* Funnel overview — Lead → Booked → Showed → Paid */}
            <div className="mb-8">
              <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-4">
                Funnel Overview
              </p>
              <ReportFunnel data={data} />
            </div>

            {/* Appointment confirmation — med spa owner marks who showed */}
            {appointmentItems.length > 0 && (
              <div className="mb-8">
                <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-1">
                  Appointment Updates
                </p>
                <p className="text-xs text-[#c4c4c4] mb-4">
                  Tap to confirm who arrived at your location
                </p>
                <div className="rounded-xl border border-[#e5e5e5] px-4">
                  <AppointmentConfirmList
                    appointments={appointmentItems}
                    reportToken={token}
                  />
                </div>
              </div>
            )}

            {/* Pipeline leaderboard */}
            {data.pipelines.length > 0 && (
              <div className="mb-8">
                <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-1">
                  Funnel Performance
                </p>
                <p className="text-xs text-[#c4c4c4] mb-4">Ranked by close rate</p>
                <div className="rounded-xl border border-[#e5e5e5] overflow-hidden px-4">
                  {data.pipelines.map((pl, i) => (
                    <FunnelRow key={pl.pipelineName} pipeline={pl} rank={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Footer */}
        <div className="pt-8 border-t border-[#f0f0f0] flex items-center justify-between">
          <p className="text-[11px] text-[#d4d4d4]">
            Powered by{" "}
            <a href="https://sourceiq.app" className="hover:text-[#a3a3a3] transition-colors">
              SourceIQ
            </a>
          </p>
          <p className="text-[11px] text-[#d4d4d4]">Data updates on every visit</p>
        </div>

      </div>
    </div>
  );
}
