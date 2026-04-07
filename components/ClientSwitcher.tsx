"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Required by AGENTS.md — Framer Motion ease must be a typed tuple.
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export type GHLLocation = {
  location_id: string;
  location_name: string;
};

type Props = {
  locations: GHLLocation[];
  currentId: string | null;
  currentName: string | null;
  onSelect: (id: string, name: string) => void;
};

// Vercel-style searchable client switcher.
// Rendered in the dashboard header when the connected GHL account has 2+ locations.
// Hidden entirely for single-location connections (no dropdown needed).
//
// Why we receive locations as props rather than fetching internally:
// The dashboard already loads ghl_locations on mount to set the initial location.
// Re-fetching here would be a redundant DB round-trip.
export default function ClientSwitcher({ locations, currentId, currentName, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Nothing to show for single-location connections
  if (locations.length < 2) return null;

  const filtered = search
    ? locations.filter((l) =>
        l.location_name.toLowerCase().includes(search.toLowerCase())
      )
    : locations;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-[#525252] border border-[#e5e5e5] bg-white px-3 py-1.5 rounded-md hover:border-[#d4d4d4] hover:text-[#0a0a0a] transition-colors max-w-[180px]"
        title={currentName ?? undefined}
      >
        <span className="truncate">{currentName ?? "Select client"}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
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
            className="absolute left-0 top-full mt-1.5 w-64 border border-[#e5e5e5] bg-white rounded-lg overflow-hidden z-50 shadow-sm"
          >
            {/* Search input */}
            <div className="px-2.5 pt-2.5 pb-1.5 border-b border-[#f5f5f5]">
              <div className="flex items-center gap-2 bg-[#f9f9f9] border border-[#e5e5e5] rounded-md px-2.5 py-1.5">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-[#a3a3a3] shrink-0">
                  <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M7.5 7.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients…"
                  className="flex-1 bg-transparent text-[11px] text-[#0a0a0a] placeholder-[#a3a3a3] outline-none"
                />
              </div>
            </div>

            {/* Location list */}
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-[11px] text-[#a3a3a3] px-3 py-3 text-center">No clients found</p>
              ) : (
                filtered.map((loc) => (
                  <button
                    key={loc.location_id}
                    onClick={() => {
                      onSelect(loc.location_id, loc.location_name);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-left transition-colors ${
                      loc.location_id === currentId
                        ? "bg-[#f5f5f5] text-[#0a0a0a] font-medium"
                        : "text-[#525252] hover:bg-[#f9f9f9] hover:text-[#0a0a0a]"
                    }`}
                  >
                    <span className="truncate">{loc.location_name}</span>
                    {loc.location_id === currentId && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-[#0a0a0a]">
                        <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
