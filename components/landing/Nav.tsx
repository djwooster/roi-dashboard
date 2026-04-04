"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronUp } from "lucide-react";
import ArrowButton from "@/components/landing/ArrowButton";

const navLinks = [
  { label: "Pricing", href: "#pricing" },
];

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="w-6 h-5 flex flex-col justify-between cursor-pointer" aria-hidden={true}>
      <motion.span
        className="block h-[2px] bg-[#0a0a0a] origin-center"
        animate={open ? { rotate: 45, y: 9, backgroundColor: "#0a0a0a" } : { rotate: 0, y: 0, backgroundColor: "#0a0a0a" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      />
      <motion.span
        className="block h-[2px] bg-[#0a0a0a]"
        animate={open ? { opacity: 0, scaleX: 0, backgroundColor: "#0a0a0a" } : { opacity: 1, scaleX: 1, backgroundColor: "#0a0a0a" }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      />
      <motion.span
        className="block h-[2px] bg-[#0a0a0a] origin-center"
        animate={open ? { rotate: -45, y: -9, backgroundColor: "#0a0a0a" } : { rotate: 0, y: 0, backgroundColor: "#0a0a0a" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      />
    </div>
  );
}

const overlayVariants = {
  hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
  visible: {
    opacity: 1,
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    clipPath: "inset(0 0 100% 0)",
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "backdrop-blur-md bg-white/95 border-b border-black/8"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[90rem] mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-70 transition-opacity z-10"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-7 h-7 bg-[#0a0a0a] flex items-center justify-center rounded-lg" aria-hidden="true">
              <ChevronUp size={20} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-[#0a0a0a] tracking-tight">SourceIQ</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#0a0a0a]/55 hover:text-[#0a0a0a] transition-colors duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
            <ArrowButton href="/signup" className="h-9 px-5 text-sm" arrowLeft="20px">
              Get started free
            </ArrowButton>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </header>

      {/* Full-screen mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col md:hidden"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex flex-col justify-center flex-1 px-8 pb-16 pt-24">
              <motion.nav
                className="flex flex-col gap-2"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {navLinks.map((link) => (
                  <motion.div key={link.href} variants={itemVariants}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center justify-between py-5 border-b border-white/10 text-white"
                    >
                      <span className="text-4xl font-bold tracking-tight leading-none">
                        {link.label}
                      </span>
                      <motion.span
                        className="text-white/30 group-hover:text-white transition-colors duration-200"
                        animate={{ x: 0, opacity: 0.3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </motion.span>
                    </Link>
                  </motion.div>
                ))}

                <motion.div variants={itemVariants} className="pt-8">
                  <ArrowButton href="/signup" variant="light" className="w-full h-14 text-base" arrowLeft="20px">
                    Get started free
                  </ArrowButton>
                </motion.div>
              </motion.nav>
            </div>

            <div className="px-8 pb-10">
              <p className="text-white/20 text-sm font-medium">SourceIQ</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
