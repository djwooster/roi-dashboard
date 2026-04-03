"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
});

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e5e5e5]">
      <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#0a0a0a] rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10l3-6 2 4 2-2 3 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-bold text-[#0a0a0a] tracking-tight">Attrify</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#pricing" className="text-xs text-[#525252] hover:text-[#0a0a0a] transition-colors font-medium">
            Pricing
          </a>
          <Link href="/login" className="text-xs text-[#525252] hover:text-[#0a0a0a] transition-colors font-medium">
            Sign in
          </Link>
          <Link href="/signup" className="text-xs font-semibold bg-[#0a0a0a] text-white px-3.5 py-2 rounded-lg hover:bg-[#262626] transition-colors">
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Dashboard preview ─────────────────────────────────────────────────────────

function DashboardPreview() {
  const sources = [
    { name: "Google Ads", leads: 94, cpl: "$44.7", roas: "4.8x", color: "#4285f4", good: true },
    { name: "Facebook Ads", leads: 61, cpl: "$50.8", roas: "3.1x", color: "#1877f2", good: false },
    { name: "Referrals", leads: 47, cpl: "$0", roas: "∞", color: "#10b981", good: true },
    { name: "Organic", leads: 38, cpl: "$21.1", roas: "7.2x", color: "#f59e0b", good: true },
  ];

  const bars = [
    { label: "Oct", rev: 68, spend: 42 },
    { label: "Nov", rev: 74, spend: 48 },
    { label: "Dec", rev: 55, spend: 38 },
    { label: "Jan", rev: 82, spend: 52 },
    { label: "Feb", rev: 91, spend: 58 },
    { label: "Mar", rev: 100, spend: 64 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-2xl overflow-hidden w-full max-w-[860px]">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f5f5f5] bg-[#fafafa]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
          <div className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
          <div className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white border border-[#e5e5e5] rounded-md px-3 py-1 text-[10px] text-[#a3a3a3] w-48 text-center">
            app.attrify.com/dashboard
          </div>
        </div>
      </div>

      <div className="flex" style={{ height: 340 }}>
        {/* Mini sidebar */}
        <div className="w-[140px] border-r border-[#f5f5f5] bg-white flex flex-col py-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 mb-4">
            <div className="w-5 h-5 bg-[#0a0a0a] rounded flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M2 10l3-6 2 4 2-2 3 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-[#0a0a0a]">Attrify</span>
          </div>
          <p className="text-[8px] font-medium text-[#a3a3a3] uppercase tracking-widest px-3 mb-1">Analytics</p>
          {["Overview", "Lead Sources", "Pipeline", "Campaigns"].map((item, i) => (
            <div key={item} className={`flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded ${i === 0 ? "bg-[#f5f5f5]" : ""}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#d4d4d4]" />
              <span className={`text-[9px] ${i === 0 ? "font-semibold text-[#0a0a0a]" : "text-[#525252]"}`}>{item}</span>
            </div>
          ))}
          <p className="text-[8px] font-medium text-[#a3a3a3] uppercase tracking-widest px-3 mb-1 mt-3">Setup</p>
          {["Integrations", "Settings"].map((item) => (
            <div key={item} className="flex items-center gap-1.5 px-3 py-1.5 mx-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]" />
              <span className="text-[9px] text-[#a3a3a3]">{item}</span>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-4 gap-2 p-3 border-b border-[#f5f5f5]">
            {[
              { label: "Total Leads", value: "247", delta: "+18%", good: true },
              { label: "Total Spend", value: "$9.4k", delta: "+6%", good: false },
              { label: "Avg CPL", value: "$38.10", delta: "-12%", good: true },
              { label: "Blended ROAS", value: "4.6x", delta: "+0.4", good: true },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-[#fafafa] rounded-lg p-2 border border-[#f5f5f5]">
                <p className="text-[8px] text-[#a3a3a3] mb-0.5">{kpi.label}</p>
                <p className="text-sm font-bold text-[#0a0a0a] leading-none">{kpi.value}</p>
                <span className={`text-[8px] font-medium mt-0.5 inline-block ${kpi.good ? "text-emerald-600" : "text-red-500"}`}>
                  {kpi.delta}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3 flex-1 min-h-0">
            <div className="flex-1 border border-[#f5f5f5] rounded-lg p-2.5 bg-white">
              <p className="text-[8px] font-semibold text-[#525252] mb-2">Revenue vs Spend</p>
              <div className="flex items-end gap-1 h-[80px]">
                {bars.map((bar) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      <div className="w-2.5 bg-[#0a0a0a] rounded-sm" style={{ height: `${bar.rev * 0.7}px` }} />
                      <div className="w-2.5 bg-[#e5e5e5] rounded-sm" style={{ height: `${bar.spend * 0.7}px` }} />
                    </div>
                    <span className="text-[6px] text-[#a3a3a3]">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 border border-[#f5f5f5] rounded-lg overflow-hidden bg-white">
              <div className="grid grid-cols-4 px-2.5 py-1.5 border-b border-[#f5f5f5]">
                {["Source", "Leads", "CPL", "ROAS"].map((h) => (
                  <span key={h} className="text-[7px] font-medium text-[#a3a3a3] uppercase tracking-wide">{h}</span>
                ))}
              </div>
              {sources.map((s, i) => (
                <div key={s.name} className={`grid grid-cols-4 px-2.5 py-1.5 items-center ${i < sources.length - 1 ? "border-b border-[#f5f5f5]" : ""}`}>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[8px] text-[#0a0a0a] truncate">{s.name}</span>
                  </div>
                  <span className="text-[8px] font-medium text-[#0a0a0a]">{s.leads}</span>
                  <span className="text-[8px] text-[#525252]">{s.cpl}</span>
                  <span className={`text-[8px] font-semibold ${s.good ? "text-emerald-600" : "text-[#525252]"}`}>{s.roas}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Check icon ────────────────────────────────────────────────────────────────

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 mt-0.5">
      <circle cx="6.5" cy="6.5" r="6" fill="#f5f5f5" />
      <path d="M4 6.5l2 2 3-3" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-full bg-white">
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-[#0a0a0a] pt-32 pb-20 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="max-w-[1100px] mx-auto relative z-10 flex flex-col items-center text-center">
          <motion.div
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-[11px] text-[#a3a3a3] mb-7"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now in beta — limited spots available
          </motion.div>

          <motion.h1
            {...fadeUp(0.07)}
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] max-w-[640px] mb-5"
          >
            Every channel. One clear picture.
          </motion.h1>

          <motion.p
            {...fadeUp(0.13)}
            className="text-[#737373] text-base max-w-[520px] leading-relaxed mb-9"
          >
            Attrify unifies your leads, spend, and revenue from every source — so you and your clients always know what's working and what's wasting budget.
          </motion.p>

          <motion.div {...fadeUp(0.18)} className="flex items-center gap-3 mb-14">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Get started free
            </Link>
            <Link
              href="/demo"
              className="text-sm font-medium text-[#a3a3a3] hover:text-white transition-colors border border-white/10 px-5 py-2.5 rounded-lg hover:border-white/20"
            >
              See live demo
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.25)} className="w-full flex justify-center">
            <DashboardPreview />
          </motion.div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="bg-[#0a0a0a] border-t border-white/5 py-20 px-6">
        <div className="max-w-[1100px] mx-auto">
          <motion.div {...fadeUp()} className="mb-12">
            <p className="text-[10px] font-medium text-[#525252] uppercase tracking-[0.18em] mb-4">The Problem</p>
            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug max-w-[480px]">
              Your data is scattered.<br />Your clients aren&apos;t patient.
            </h2>
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            {[
              {
                num: "01",
                title: "5 tabs to answer 1 question",
                body: "Switching between Google Ads, Meta, your CRM, and a spreadsheet every time a client asks how their campaigns are performing.",
              },
              {
                num: "02",
                title: "Manual exports, every week",
                body: "Hours spent reformatting data that should already be formatted. Time you don't have, on work that doesn't move the needle.",
              },
              {
                num: "03",
                title: "No single source of truth",
                body: "Your team is looking at different numbers. Your clients are asking questions you can't answer fast. Everyone's flying blind.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.num}
                {...fadeUp(i * 0.08)}
                className="border border-white/8 rounded-xl p-6"
              >
                <p className="text-3xl font-bold text-white/10 mb-4 leading-none">{card.num}</p>
                <p className="text-sm font-semibold text-white mb-2">{card.title}</p>
                <p className="text-xs text-[#737373] leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-white border-t border-[#e5e5e5]">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 gap-16 items-start">
            {/* Left — sticky description */}
            <motion.div {...fadeUp()} className="sticky top-24">
              <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-[0.18em] mb-4">Why Attrify</p>
              <h2 className="text-2xl font-bold text-[#0a0a0a] tracking-tight leading-snug mb-4">
                Built for agencies.<br />Loved by clients.
              </h2>
              <p className="text-xs text-[#737373] leading-relaxed max-w-[320px]">
                Everything you need to run attribution for every client — without building it yourself.
              </p>
            </motion.div>

            {/* Right — feature cards */}
            <div className="space-y-4">
              {[
                {
                  label: "Multi-client dashboard",
                  title: "One login. Every client.",
                  body: "Switch between client workspaces in a click — each with its own data, views, and integrations. Built for agencies managing multiple accounts.",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
                      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
                      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
                      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  ),
                },
                {
                  label: "Real attribution",
                  title: "Know what's actually working.",
                  body: "See every lead, appointment, and closed deal traced back to its source. Stop guessing and start making budget decisions backed by real numbers.",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="8" cy="8" r="1" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  label: "Deep integrations",
                  title: "Connect in minutes.",
                  body: "GoHighLevel, HubSpot, Salesforce, Facebook Ads, Google Ads, Jobber — all talking to each other, all in one place. More integrations shipping regularly.",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="6" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
                      <rect x="11" y="6" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M5 8h6M8 4V2M8 12v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  ),
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  {...fadeUp(i * 0.08)}
                  className="border border-[#e5e5e5] rounded-xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#f5f5f5] rounded-lg flex items-center justify-center text-[#525252] shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-widest mb-1">{feature.label}</p>
                      <p className="text-sm font-semibold text-[#0a0a0a] mb-1.5">{feature.title}</p>
                      <p className="text-xs text-[#737373] leading-relaxed">{feature.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Integrations ── */}
      <section className="py-20 px-6 bg-[#fafafa] border-t border-[#e5e5e5]">
        <div className="max-w-[1100px] mx-auto">
          <motion.div {...fadeUp()} className="mb-10">
            <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-[0.18em] mb-4">Integrations</p>
            <h2 className="text-2xl font-bold text-[#0a0a0a] tracking-tight mb-3">Connect your entire stack.</h2>
            <p className="text-xs text-[#737373]">
              More integrations shipping regularly. Don&apos;t see yours?{" "}
              <a href="mailto:hello@attrify.app" className="text-[#525252] underline underline-offset-2 hover:text-[#0a0a0a] transition-colors">
                Let us know
              </a>
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "GoHighLevel", letter: "GHL", bg: "#3B82F6", category: "CRM", body: "Sync contacts, pipelines, and appointment data automatically." },
              { name: "HubSpot", letter: "H", bg: "#F97316", category: "CRM", body: "Pull deal stages, contact records, and pipeline value." },
              { name: "Salesforce", letter: "SF", bg: "#38BDF8", category: "CRM", body: "Import opportunity data and closed-won revenue by source." },
              { name: "Facebook Ads", letter: "f", bg: "#1877f2", category: "Advertising", body: "Ingest campaign spend, impressions, and lead form data." },
              { name: "Google Ads", letter: "G", bg: "#4285f4", category: "Advertising", body: "Track conversions, spend, and keyword-level CPL in real time." },
              { name: "Jobber", letter: "J", bg: "#4ADE80", category: "Field Service", body: "Sync scheduled jobs, invoices, and customer lifetime value." },
            ].map((item, i) => (
              <motion.div
                key={item.name}
                {...fadeUp(i * 0.06)}
                className="bg-white border border-[#e5e5e5] rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: item.bg }}
                  >
                    {item.letter}
                  </div>
                  <span className="text-[10px] text-[#a3a3a3] border border-[#e5e5e5] px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#0a0a0a] mb-1">{item.name}</p>
                <p className="text-xs text-[#737373] leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6 bg-white border-t border-[#e5e5e5]">
        <div className="max-w-[1100px] mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-[0.18em] mb-4">Pricing</p>
            <h2 className="text-2xl font-bold text-[#0a0a0a] tracking-tight">Start free. Scale when you&apos;re ready.</h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 max-w-[720px] mx-auto">
            {/* Free */}
            <motion.div {...fadeUp(0.05)} className="border border-[#e5e5e5] rounded-2xl p-7">
              <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-widest mb-4">Free</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold text-[#0a0a0a] leading-none">$0</span>
                <span className="text-xs text-[#a3a3a3] mb-1">forever</span>
              </div>
              <div className="space-y-2.5 mb-7">
                {[
                  "1 client workspace",
                  "2 integrations",
                  "30 days of data history",
                  "Core metrics dashboard",
                  "Lead source performance table",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check />
                    <span className="text-xs text-[#525252]">{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="block w-full text-center text-xs font-semibold text-[#0a0a0a] border border-[#e5e5e5] py-2.5 rounded-lg hover:border-[#a3a3a3] transition-colors"
              >
                Get started free
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div {...fadeUp(0.1)} className="bg-[#0a0a0a] rounded-2xl p-7 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Pro</p>
                <span className="text-[10px] font-semibold bg-white text-[#0a0a0a] px-2.5 py-1 rounded-full">
                  Most popular
                </span>
              </div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold text-white leading-none">$69</span>
                <span className="text-xs text-white/40 mb-1">/ month</span>
              </div>
              <div className="space-y-2.5 mb-7">
                {[
                  "Unlimited client workspaces",
                  "All integrations (+ new ones as they ship)",
                  "12 months of data history",
                  "Per-client custom views",
                  "Real-time alerts ticker",
                  "White-label & remove Attrify branding",
                  "CSV + PDF exports",
                  "Priority support",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 mt-0.5">
                      <circle cx="6.5" cy="6.5" r="6" fill="white/10" fillOpacity="0.1" />
                      <path d="M4 6.5l2 2 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs text-white/70">{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="block w-full text-center text-xs font-semibold text-[#0a0a0a] bg-white py-2.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                Start Pro
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-[#0a0a0a] relative overflow-hidden border-t border-white/5">
        <motion.div {...fadeUp()} className="max-w-[600px] mx-auto text-center">
          <p className="text-[10px] font-medium text-[#525252] uppercase tracking-[0.18em] mb-5">Get started</p>
          <h2 className="text-3xl font-bold text-white tracking-tight leading-snug mb-4">
            Your clients deserve better reporting.<br />Give it to them today.
          </h2>
          <p className="text-sm text-[#737373] mb-8 leading-relaxed">
            Free to start. No credit card required. Set up your first client workspace in minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#0a0a0a] text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
          >
            Get started free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#e5e5e5] py-6 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <span className="text-sm font-bold text-[#0a0a0a]">Attrify</span>
          <p className="text-[11px] text-[#a3a3a3]">© {new Date().getFullYear()} Attrify. All rights reserved.</p>
          <a href="mailto:hello@attrify.app" className="text-[11px] text-[#a3a3a3] hover:text-[#525252] transition-colors">
            hello@attrify.app
          </a>
        </div>
      </footer>
    </div>
  );
}
