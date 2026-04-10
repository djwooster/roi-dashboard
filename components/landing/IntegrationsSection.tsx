"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const integrations = [
  {
    abbr: "GHL",
    color: "#3B82F6",
    name: "GoHighLevel",
    category: "CRM",
    description: "Sync contacts, pipelines, and appointment data automatically.",
  },
  {
    abbr: "H",
    color: "#F97316",
    name: "HubSpot",
    category: "CRM",
    description: "Pull deal stages, contact records, and pipeline value.",
  },
  {
    abbr: "SF",
    color: "#38BDF8",
    name: "Salesforce",
    category: "CRM",
    description: "Import opportunity data and closed-won revenue by source.",
  },
  {
    abbr: "f",
    color: "#3B82F6",
    name: "Facebook Ads",
    category: "Advertising",
    description: "Ingest campaign spend, impressions, and lead form data.",
  },
  {
    abbr: "J",
    color: "#4ADE80",
    name: "Jobber",
    category: "Field Service",
    description: "Sync scheduled jobs, invoices, and customer lifetime value.",
  },
];

export default function IntegrationsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#fafaf9] py-28 px-6 border-t border-black/8">
      <div className="max-w-[90rem] mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#0a0a0a]/35 mb-5">
              Integrations
            </p>
            <h2 className="section-headline text-[#0a0a0a]">
              Connect your entire stack.
            </h2>
          </div>
          <p className="text-sm text-[#0a0a0a]/40 md:text-right md:max-w-xs leading-relaxed">
            More integrations shipping regularly. Don&apos;t see yours?{" "}
            <a href="mailto:hello@attrify.app" className="underline hover:text-[#0a0a0a]/70 transition-colors">
              Let us know.
            </a>
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/8"
        >
          {integrations.map((int) => (
            <motion.div
              key={int.name}
              variants={fadeUp}
              className="flex flex-col gap-4 p-8 bg-[#fafaf9]"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 flex items-center justify-center text-white font-bold text-base"
                  style={{ backgroundColor: int.color, borderRadius: "10px" }}
                >
                  {int.abbr}
                </div>
                <span className="text-xs font-medium text-[#0a0a0a]/35 border border-black/10 px-2.5 py-1">
                  {int.category}
                </span>
              </div>
              <div>
                <p className="font-bold text-[#0a0a0a] text-base mb-1">{int.name}</p>
                <p className="text-sm text-[#0a0a0a]/45 leading-relaxed">{int.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
