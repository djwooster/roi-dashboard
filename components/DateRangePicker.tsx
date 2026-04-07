"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Required by AGENTS.md — Framer Motion ease must be a typed tuple.
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export type DateRange = {
  label: string;
  from: string; // ISO date string "YYYY-MM-DD"
  to: string;   // ISO date string "YYYY-MM-DD"
} | null; // null = all time (no date filter sent to GHL)

// Returns "YYYY-MM-DD" for a date N days ago (0 = today).
function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// Build presets at call-time so dates are always relative to now.
// Called inside the component so a long-lived tab still gets fresh dates on open.
function buildPresets(): { label: string; range: DateRange }[] {
  const today = isoDate(0);
  return [
    { label: "All time",     range: null },
    { label: "Today",        range: { label: "Today",        from: today,      to: today } },
    { label: "Last 7 days",  range: { label: "Last 7 days",  from: isoDate(6), to: today } },
    { label: "Last 30 days", range: { label: "Last 30 days", from: isoDate(29),to: today } },
    { label: "Last 90 days", range: { label: "Last 90 days", from: isoDate(89),to: today } },
  ];
}

type Props = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

// Preset-based date range selector for the dashboard header.
// Agencies mostly think in standard windows (7/30/90 days), so full calendar
// pickers are overkill until a custom range use case emerges.
//
// Why null represents "all time": we skip the startDate/endDate params entirely
// when null — GHL returns all records, which is the correct all-time behaviour.
export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const presets = buildPresets();
  const displayLabel = value?.label ?? "All time";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-[#525252] border border-[#e5e5e5] bg-white px-3 py-1.5 rounded-md hover:border-[#d4d4d4] hover:text-[#0a0a0a] transition-colors"
      >
        {/* Calendar icon */}
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-[#a3a3a3]">
          <rect x="1" y="2" width="9" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.1" />
          <path d="M1 4.5h9M3.5 1v2M7.5 1v2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
        {displayLabel}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="absolute right-0 top-full mt-1.5 w-40 border border-[#e5e5e5] bg-white rounded-lg overflow-hidden z-50 shadow-sm py-1"
          >
            {presets.map((preset, i) => {
              const active =
                preset.range === null
                  ? value === null
                  : value?.label === preset.range.label;
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    onChange(preset.range);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-left transition-colors ${
                    active
                      ? "bg-[#f5f5f5] text-[#0a0a0a] font-medium"
                      : "text-[#525252] hover:bg-[#f9f9f9] hover:text-[#0a0a0a]"
                  } ${i > 0 ? "border-t border-[#f9f9f9]" : ""}`}
                >
                  {preset.label}
                  {active && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-[#0a0a0a]">
                      <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
