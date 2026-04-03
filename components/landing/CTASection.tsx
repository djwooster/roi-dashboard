"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import ArrowButton from "@/components/landing/ArrowButton";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0a0a0a] noise py-32 px-6" id="contact">
      <div className="max-w-[90rem] mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-col items-start md:items-center gap-8"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/35">
            Get started
          </p>

          <h2
            className="font-extrabold text-white text-left md:text-center"
            style={{
              fontSize: "clamp(28px, 3.2vw, 48px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
            }}
          >
            Your clients deserve better reporting.<br className="hidden sm:block" /> Give it to them today.
          </h2>

          <p className="text-lg text-white/50 max-w-lg leading-relaxed md:text-center">
            Free to start. No credit card required. Set up your first client workspace in minutes.
          </p>

          <ArrowButton href="/signup" variant="light" className="w-full md:w-auto h-14 px-10 text-base">
            Get started free
          </ArrowButton>
        </motion.div>
      </div>
    </section>
  );
}
