"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

function GridIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="11" height="11" stroke="#0a0a0a" strokeWidth="1.5" strokeOpacity="0.5" />
      <rect x="18" y="3" width="11" height="11" stroke="#0a0a0a" strokeWidth="1.5" strokeOpacity="0.5" />
      <rect x="3" y="18" width="11" height="11" stroke="#0a0a0a" strokeWidth="1.5" strokeOpacity="0.5" />
      <rect x="18" y="18" width="11" height="11" stroke="#0a0a0a" strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="#0a0a0a" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="16" cy="16" r="6" stroke="#0a0a0a" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="16" cy="16" r="2" fill="#0a0a0a" fillOpacity="0.5" />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M11 4 L11 12" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M21 4 L21 12" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M7 12 L25 12 L25 18 C25 22.4 21.4 26 17 26 L15 26 C10.6 26 7 22.4 7 18 Z" stroke="#0a0a0a" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M16 26 L16 30" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
}

const features = [
  {
    icon: <GridIcon />,
    label: "Multi-client dashboard",
    headline: "One login. Every client.",
    body: "Switch between client workspaces in a click — each with its own data, views, and integrations. Built for agencies managing multiple accounts.",
  },
  {
    icon: <TargetIcon />,
    label: "Real attribution",
    headline: "Know what's actually working.",
    body: "See every lead, appointment, and closed deal traced back to its source. Stop guessing and start making budget decisions backed by real numbers.",
  },
  {
    icon: <PlugIcon />,
    label: "Deep integrations",
    headline: "Connect in minutes.",
    body: "GoHighLevel, HubSpot, Salesforce, Facebook Ads, Google Ads, Jobber — all talking to each other, all in one place. More integrations shipping regularly.",
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-white py-28 px-6">
      <div className="max-w-[90rem] mx-auto grid md:grid-cols-[2fr_3fr] gap-16 items-start" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-col gap-5 md:sticky md:top-24 md:self-start"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#0a0a0a]/35">
            Why SourceIQ
          </p>
          <h2 className="section-headline text-[#0a0a0a]">
            Built for agencies.<br />Loved by clients.
          </h2>
          <p className="text-lg text-[#0a0a0a]/50 leading-relaxed max-w-sm">
            Everything you need to run attribution for every client — without building it yourself.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex flex-col gap-px border border-black/8"
        >
          {features.map((f) => (
            <motion.div
              key={f.label}
              variants={fadeUp}
              className="flex flex-col gap-6 p-10 bg-white border-b border-black/8 last:border-b-0"
            >
              <div className="flex items-start gap-5">
                <div className="shrink-0 mt-0.5">{f.icon}</div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0a0a0a]/35">{f.label}</p>
                  <h3
                    className="font-bold text-[#0a0a0a] leading-snug"
                    style={{ fontSize: "clamp(18px, 1.4vw, 22px)" }}
                  >
                    {f.headline}
                  </h3>
                  <p className="text-[#0a0a0a]/50 leading-relaxed text-base mt-1">{f.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
