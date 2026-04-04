"use client";

import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  };
}

export default function Hero() {
  return (
    <section className="relative bg-white pt-6" style={{ overflowX: "clip" }} id="home">
      <div className="relative z-10 max-w-[90rem] mx-auto px-6 pt-[136px] pb-0 md:pt-[220px] md:pb-0">
        <h1
          className="font-semibold text-[#0a0a0a] leading-[1.15] tracking-[-0.02em] mb-4"
          style={{ fontSize: "clamp(24px, 3vw, 80px)" }}
          aria-label="Every channel. One clear picture."
        >
          <motion.span {...fadeUp(0.34)} className="block">
            Every channel. One clear picture.
          </motion.span>
        </h1>

        <motion.p
          {...fadeUp(0.6)}
          className="text-[#0a0a0a]/50 leading-relaxed max-w-2xl"
          style={{ fontSize: "clamp(18px, 1.2vw, 24px)" }}
        >
          SourceIQ unifies your leads, spend, and revenue from every source — so you and your clients always know what&apos;s working and what&apos;s wasting budget.
        </motion.p>

        <motion.div {...fadeUp(0.72)} className="flex items-center gap-4 mt-8 flex-wrap">
          <a
            href="/signup"
            className="group relative inline-flex items-center justify-center gap-2 font-bold overflow-hidden transition-colors duration-200 bg-[#0a0a0a] text-white hover:bg-[#0a0a0a]/85 h-9 px-5 text-xs rounded-lg"
          >
            Get started free
          </a>
          <a
            href="/demo"
            className="inline-flex items-center justify-center gap-2 font-semibold text-xs h-9 px-5 border border-black/15 text-[#0a0a0a] hover:bg-[#0a0a0a]/5 transition-colors duration-200 rounded-lg"
          >
            View live demo
          </a>
        </motion.div>
      </div>

      {/* ROI dashboard image */}
      <motion.div {...fadeUp(0.8)} className="w-full pt-20 pb-16">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="relative w-[90vw] border-t border-l border-r border-black/15 overflow-hidden max-h-[220px] sm:max-h-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/roi-dashboard.png" alt="SourceIQ Dashboard" className="block h-auto max-w-none w-[220%] sm:w-full" />
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{ height: "40%", background: "linear-gradient(to bottom, transparent, white)" }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
