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

const problems = [
  {
    number: "01",
    headline: "5 tabs to answer 1 question",
    body: "Switching between Google Ads, Meta, your CRM, and a spreadsheet every time a client asks how their campaigns are performing.",
  },
  {
    number: "02",
    headline: "Manual exports, every week",
    body: "Hours spent reformatting data that should already be formatted. Time you don't have, on work that doesn't move the needle.",
  },
  {
    number: "03",
    headline: "No single source of truth",
    body: "Your team is looking at different numbers. Your clients are asking questions you can't answer fast. Everyone's flying blind.",
  },
];

export default function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0a0a0a] noise py-28 px-6">
      <div className="max-w-[90rem] mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/35 mb-5">
            The problem
          </p>
          <h2 className="section-headline text-white max-w-2xl">
            Your data is scattered.<br />Your clients aren&apos;t patient.
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-px border border-white/10"
        >
          {problems.map((p) => (
            <motion.div
              key={p.number}
              variants={fadeUp}
              className="flex flex-col gap-5 p-10 border-white/10"
              style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            >
              <span className="text-xs font-bold tracking-[0.15em] text-white/20">{p.number}</span>
              <h3
                className="font-bold text-white leading-snug"
                style={{ fontSize: "clamp(18px, 1.4vw, 22px)" }}
              >
                {p.headline}
              </h3>
              <p className="text-white/45 leading-relaxed text-base">{p.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
