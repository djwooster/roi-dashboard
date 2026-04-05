"use client";

import Link from "next/link";
import Dashboard from "@/app/dashboard/page";
import { DemoContext } from "@/lib/demo-context";

export default function DemoPage() {
  return (
    <div className="relative h-full">
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] text-white flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium">
            You&apos;re viewing a live demo — all data is simulated
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs text-[#a3a3a3] hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-xs font-medium bg-white text-[#0a0a0a] px-3 py-1.5 rounded-md hover:bg-[#f5f5f5] transition-colors"
          >
            Start free →
          </Link>
        </div>
      </div>

      {/* Push dashboard content below the banner */}
      <div className="pt-[37px] h-full">
        <DemoContext.Provider value={true}>
          <Dashboard />
        </DemoContext.Provider>
      </div>
    </div>
  );
}
