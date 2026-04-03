"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
        <div className="flex items-center gap-4">
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

// ── Dashboard preview mockup ──────────────────────────────────────────────────

function DashboardPreview() {
  const sources = [
    { name: "Google Ads", leads: 94, spend: "$4,200", cpl: "$44.7", roas: "4.8x", color: "#4285f4" },
    { name: "Facebook Ads", leads: 61, spend: "$3,100", cpl: "$50.8", roas: "3.1x", color: "#1877f2" },
    { name: "Referrals", leads: 47, spend: "$0", cpl: "$0", roas: "∞", color: "#10b981" },
    { name: "Organic", leads: 38, spend: "$800", cpl: "$21.1", roas: "7.2x", color: "#f59e0b" },
  ];

  const bars = [
    { label: "Oct", revenue: 68, spend: 42 },
    { label: "Nov", revenue: 74, spend: 48 },
    { label: "Dec", revenue: 55, spend: 38 },
    { label: "Jan", revenue: 82, spend: 52 },
    { label: "Feb", revenue: 91, spend: 58 },
    { label: "Mar", revenue: 100, spend: 64 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-2xl overflow-hidden w-full max-w-[860px]">
      {/* Dashboard header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f5f5f5] bg-[#fafafa]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
          <div className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
          <div className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white border border-[#e5e5e5] rounded-md px-3 py-1 text-[10px] text-[#a3a3a3] w-48 text-center">
            app.attrify.com/dashboard
          </div>
        </div>
      </div>

      <div className="flex h-[340px]">
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
          {/* KPI bar */}
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

          {/* Charts + table */}
          <div className="flex gap-2 p-3 flex-1 min-h-0">
            {/* Bar chart */}
            <div className="flex-1 border border-[#f5f5f5] rounded-lg p-2.5 bg-white">
              <p className="text-[8px] font-semibold text-[#525252] mb-2">Revenue vs Spend</p>
              <div className="flex items-end gap-1 h-[80px]">
                {bars.map((bar) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      <div className="w-2.5 bg-[#0a0a0a] rounded-sm" style={{ height: `${bar.revenue * 0.7}px` }} />
                      <div className="w-2.5 bg-[#e5e5e5] rounded-sm" style={{ height: `${bar.spend * 0.7}px` }} />
                    </div>
                    <span className="text-[6px] text-[#a3a3a3]">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Source table */}
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
                  <span className={`text-[8px] font-semibold ${s.roas === "∞" || parseFloat(s.roas) >= 4 ? "text-emerald-600" : "text-[#525252]"}`}>
                    {s.roas}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-full bg-white">
      <Nav />

      {/* Hero */}
      <section className="bg-[#0a0a0a] pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="max-w-[1100px] mx-auto relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-[11px] text-[#a3a3a3] mb-7"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now in beta — limited spots available
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] max-w-[720px] mb-5"
          >
            Know exactly which channels are driving your revenue
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="text-[#737373] text-base max-w-[520px] leading-relaxed mb-9"
          >
            Attrify connects your ad accounts, CRM, and field tools to show you cost per lead, ROAS, and real revenue — by channel, by campaign, every day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3 mb-14"
          >
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Start free →
            </Link>
            <Link
              href="/demo"
              className="text-sm font-medium text-[#a3a3a3] hover:text-white transition-colors border border-white/10 px-5 py-2.5 rounded-lg hover:border-white/20"
            >
              See live demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full flex justify-center"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </section>

      {/* Integration logos */}
      <section className="border-b border-[#e5e5e5] py-8 px-6 bg-[#fafafa]">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-[11px] text-[#a3a3a3] text-center mb-6 uppercase tracking-widest font-medium">
            Connects with the tools you already use
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[
              { name: "Google Ads", color: "#4285f4", letter: "G" },
              { name: "Facebook Ads", color: "#1877f2", letter: "f" },
              { name: "GoHighLevel", color: "#0ea5e9", letter: "GHL" },
              { name: "HubSpot", color: "#ff7a59", letter: "H" },
              { name: "Salesforce", color: "#00a1e0", letter: "SF" },
              { name: "Jobber", color: "#6fbd44", letter: "J" },
            ].map((integration) => (
              <div key={integration.name} className="flex items-center gap-2 text-[#525252]">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: integration.color }}
                >
                  {integration.letter}
                </div>
                <span className="text-xs font-medium">{integration.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl font-bold text-[#0a0a0a] tracking-tight mb-3">
              One dashboard. Every marketing dollar, justified.
            </h2>
            <p className="text-sm text-[#737373] max-w-[440px] mx-auto">
              Stop toggling between ad platforms, spreadsheets, and CRMs. Attrify pulls it all together automatically.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="1" y="5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="13" y="5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5 7h8M9 4V2M9 14v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <rect x="7" y="12" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                ),
                title: "Connect your stack",
                body: "Link Google Ads, Facebook, GoHighLevel, HubSpot, and more in minutes. No engineers required.",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 13l4-7 3 5 2.5-3L15 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="15" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                ),
                title: "See what's working",
                body: "CPL, ROAS, cost per appointment, and closed revenue — broken down by source, campaign, and month.",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M9 5v4l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                ),
                title: "Cut what isn't",
                body: "With clear attribution, you know exactly where to put your next dollar — and what to turn off immediately.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="border border-[#e5e5e5] rounded-xl p-6"
              >
                <div className="w-9 h-9 bg-[#f5f5f5] rounded-lg flex items-center justify-center text-[#525252] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-[#0a0a0a] mb-2">{feature.title}</h3>
                <p className="text-xs text-[#737373] leading-relaxed">{feature.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-[#fafafa] border-t border-[#e5e5e5]">
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl font-bold text-[#0a0a0a] tracking-tight mb-3">Up and running in minutes</h2>
            <p className="text-sm text-[#737373]">No setup calls. No spreadsheets. No guesswork.</p>
          </motion.div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect your tools",
                body: "Authorize your ad accounts and CRM with a few clicks. OAuth-based, read-only access — we never touch your campaigns.",
              },
              {
                step: "02",
                title: "We sync your data",
                body: "Attrify automatically pulls leads, spend, and revenue every day and maps them to the right source.",
              },
              {
                step: "03",
                title: "See your ROI",
                body: "Your dashboard updates automatically. Drill into any channel, campaign, or time period instantly.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex flex-col"
              >
                <span className="text-4xl font-bold text-[#e5e5e5] mb-4 leading-none">{step.step}</span>
                <h3 className="text-sm font-semibold text-[#0a0a0a] mb-2">{step.title}</h3>
                <p className="text-xs text-[#737373] leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-[#0a0a0a]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-[560px] mx-auto text-center"
        >
          <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
            Stop guessing.<br />Start knowing.
          </h2>
          <p className="text-[#737373] text-sm mb-8 leading-relaxed">
            Join businesses that have replaced spreadsheets and gut feelings with clear, real-time marketing attribution.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Get started free →
            </Link>
            <Link
              href="/demo"
              className="text-sm font-medium text-[#737373] hover:text-white transition-colors"
            >
              See live demo
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] py-8 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#0a0a0a] rounded flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M2 10l3-6 2 4 2-2 3 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs font-bold text-[#0a0a0a]">Attrify</span>
          </div>
          <p className="text-[11px] text-[#a3a3a3]">© {new Date().getFullYear()} Attrify. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[11px] text-[#a3a3a3] hover:text-[#525252] transition-colors">Sign in</Link>
            <Link href="/demo" className="text-[11px] text-[#a3a3a3] hover:text-[#525252] transition-colors">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
