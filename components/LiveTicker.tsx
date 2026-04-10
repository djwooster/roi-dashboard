"use client";

import { useRef } from "react";

const messages = [
  "3 new leads from Meta Ads in the last hour",
  "Facebook ROAS dropped below 2x · Review campaign budgets",
  "2 appointments confirmed showed today · Show rate 68%",
  "Referral channel closed 4 new jobs overnight · Avg deal $9,800",
  "New GHL opportunity created · Est. value $11,200",
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
