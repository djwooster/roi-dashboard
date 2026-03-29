"use client";

import { useRef } from "react";

const messages = [
  "3 new leads from Google Ads in the last hour",
  "Facebook ROAS dropped below 2x · Review campaign budgets",
  "Home Show CPL improved 18% this week",
  "Referral channel closed 4 new jobs overnight · Avg deal $9,800",
  "iPad Kiosk — Lowe's #0847 booked 6 appointments today",
  "Google Brand campaign approaching monthly spend cap",
  "New proposal sent to lead from Organic Search · Est. value $11,200",
  "Appointment complete rate up 6pts month-over-month",
];

// Duplicate for seamless loop
const allMessages = [...messages, ...messages];

export default function LiveTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  function handleMouseEnter() {
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = "paused";
    }
  }

  function handleMouseLeave() {
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = "running";
    }
  }

  return (
    <div
      className="h-8 bg-[#f5f5f5] border-b border-[#e5e5e5] overflow-hidden flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap shrink-0"
        style={{
          animation: "ticker-scroll 60s linear infinite",
        }}
      >
        {allMessages.map((msg, i) => (
          <span
            key={i}
            className="text-[11px] text-[#525252] px-6 flex items-center gap-1.5"
          >
            <span className="w-1 h-1 rounded-full bg-[#a3a3a3] inline-block shrink-0" />
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
