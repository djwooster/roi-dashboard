"use client";

// AppointmentConfirmList — interactive appointment confirmation UI for the report page.
// Med spa owner sees each recent appointment and taps "Showed" or "No Show".
// No login required — the report token (passed as prop) authorizes the request.
//
// Why client component: the confirmation buttons need interactivity (optimistic UI,
// POST calls). The report page (server component) fetches the initial appointment
// list + existing confirmations server-side and passes them as props here.

import { useState, useTransition } from "react";

export type AppointmentItem = {
  id: string;              // GHL appointment ID
  contactName: string;
  appointmentAt: string;   // ISO date string
  outcome: "showed" | "no_show" | null; // null = not yet confirmed
};

type Props = {
  appointments: AppointmentItem[];
  reportToken: string;
};

// Formats an ISO date string to a human-readable time like "Mon Apr 7 · 10:30 AM"
function fmtApptTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    }) + " · " + d.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function AppointmentConfirmList({ appointments, reportToken }: Props) {
  // Track outcome state per appointment ID. Initialized from server-fetched data.
  const [outcomes, setOutcomes] = useState<Record<string, "showed" | "no_show" | null>>(
    () => Object.fromEntries(appointments.map((a) => [a.id, a.outcome]))
  );
  const [isPending, startTransition] = useTransition();
  const [errorId, setErrorId] = useState<string | null>(null);

  async function confirm(
    appointmentId: string,
    outcome: "showed" | "no_show",
    contactName: string,
    appointmentAt: string,
  ) {
    // Optimistic update — show the result immediately before the API responds
    setOutcomes((prev) => ({ ...prev, [appointmentId]: outcome }));
    setErrorId(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/appointments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: reportToken,
            ghl_appointment_id: appointmentId,
            outcome,
            contact_name: contactName,
            appointment_at: appointmentAt,
          }),
        });

        if (!res.ok) {
          // Revert on failure
          setOutcomes((prev) => ({ ...prev, [appointmentId]: appointments.find((a) => a.id === appointmentId)?.outcome ?? null }));
          setErrorId(appointmentId);
        }
      } catch {
        setOutcomes((prev) => ({ ...prev, [appointmentId]: appointments.find((a) => a.id === appointmentId)?.outcome ?? null }));
        setErrorId(appointmentId);
      }
    });
  }

  if (appointments.length === 0) {
    return (
      <p className="text-sm text-[#d4d4d4] py-4 text-center">
        No appointments found for this period.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appt) => {
        const currentOutcome = outcomes[appt.id];
        const isConfirmed = currentOutcome !== null;
        const hasError = errorId === appt.id;

        return (
          <div
            key={appt.id}
            className="flex items-center gap-3 py-3 border-b border-[#f0f0f0] last:border-0"
          >
            {/* Appointment details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0a0a0a] truncate">{appt.contactName}</p>
              <p className="text-xs text-[#a3a3a3] mt-0.5">{fmtApptTime(appt.appointmentAt)}</p>
              {hasError && (
                <p className="text-[11px] text-red-500 mt-0.5">Failed to save — tap again</p>
              )}
            </div>

            {/* Action buttons or confirmed badge */}
            {isConfirmed ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    currentOutcome === "showed"
                      ? "bg-green-50 text-green-700"
                      : "bg-[#f5f5f5] text-[#a3a3a3]"
                  }`}
                >
                  {currentOutcome === "showed" ? "Showed" : "No Show"}
                </span>
                {/* Allow changing the answer */}
                <button
                  onClick={() => setOutcomes((prev) => ({ ...prev, [appt.id]: null }))}
                  className="text-[10px] text-[#d4d4d4] hover:text-[#a3a3a3] transition-colors"
                  disabled={isPending}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => confirm(appt.id, "showed", appt.contactName, appt.appointmentAt)}
                  disabled={isPending}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-[#0a0a0a] text-white hover:bg-[#262626] transition-colors disabled:opacity-50"
                >
                  Showed
                </button>
                <button
                  onClick={() => confirm(appt.id, "no_show", appt.contactName, appt.appointmentAt)}
                  disabled={isPending}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-[#f5f5f5] text-[#525252] hover:bg-[#ebebeb] transition-colors disabled:opacity-50"
                >
                  No Show
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
