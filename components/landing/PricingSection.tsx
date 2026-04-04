"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

function Check({ dark }: { dark?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 mt-0.5">
      <path
        d="M2.5 7L5.5 10L11.5 4"
        stroke={dark ? "white" : "#0a0a0a"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={dark ? 0.8 : 0.6}
      />
    </svg>
  );
}

const freeTier = [
  "1 client workspace",
  "2 integrations",
  "30 days of data history",
  "Core metrics dashboard (leads, spend, CPL, ROAS)",
  "Lead source performance table",
];

const proTier = [
  "Unlimited client workspaces",
  "All integrations (+ new ones as they ship)",
  "12 months of data history",
  "Per-client custom views",
  "Real-time alerts ticker",
  "White-label & remove SourceIQ branding",
  "CSV + PDF exports",
  "Priority support",
];

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-white py-28 px-6 border-t border-black/8" id="pricing">
      <div className="max-w-[90rem] mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#0a0a0a]/35 mb-5">
            Pricing
          </p>
          <h2 className="section-headline text-[#0a0a0a]">
            Start free. Scale when you&apos;re ready.
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black/8 max-w-4xl"
        >
          {/* Free */}
          <motion.div variants={fadeUp} className="flex flex-col p-10 bg-white">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0a0a0a]/35 mb-6">Free</p>
            <div className="mb-8">
              <span
                className="font-extrabold text-[#0a0a0a] leading-none"
                style={{ fontSize: "clamp(40px, 4vw, 56px)", letterSpacing: "-0.04em" }}
              >
                $0
              </span>
              <span className="text-sm text-[#0a0a0a]/40 ml-2">forever</span>
            </div>
            <ul className="flex flex-col gap-3 mb-10 flex-1">
              {freeTier.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#0a0a0a]/60 leading-relaxed">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="inline-flex items-center justify-center font-bold text-sm h-12 px-7 border border-black/15 text-[#0a0a0a] hover:bg-[#0a0a0a]/5 transition-colors duration-200 rounded-lg"
            >
              Get started free
            </a>
          </motion.div>

          {/* Pro */}
          <motion.div variants={fadeUp} className="flex flex-col p-10 bg-[#0a0a0a] noise">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/35">Pro</p>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#0a0a0a] bg-white px-2.5 py-1">
                Most popular
              </span>
            </div>
            <div className="mb-8">
              <span
                className="font-extrabold text-white leading-none"
                style={{ fontSize: "clamp(40px, 4vw, 56px)", letterSpacing: "-0.04em" }}
              >
                $69
              </span>
              <span className="text-sm text-white/40 ml-2">/ month</span>
            </div>
            <ul className="flex flex-col gap-3 mb-10 flex-1">
              {proTier.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <Check dark />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="inline-flex items-center justify-center font-bold text-sm h-12 px-7 bg-white text-[#0a0a0a] hover:bg-white/90 transition-colors duration-200 rounded-lg"
            >
              Start Pro
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
