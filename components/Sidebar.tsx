"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { roasAlerts } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  label: string;
  page: string;
  icon: React.ReactNode;
  disabled?: boolean;
  badge?: "roas-alert";
};

const navItems: NavItem[] = [
  {
    label: "Overview",
    page: "overview",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    label: "Lead Sources",
    page: "overview",
    badge: "roas-alert",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Pipeline",
    page: "overview",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M1.5 7.5h12M1.5 3.5h9M1.5 11.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Campaigns",
    page: "overview",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 1.5L9.5 5.5L14 6.2L10.75 9.3L11.5 13.8L7.5 11.7L3.5 13.8L4.25 9.3L1 6.2L5.5 5.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Integrations",
    page: "integrations",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="10" y="5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 7h5M7.5 4V2M7.5 11v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    page: "settings",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M6.3 1.5L6 3.2a5 5 0 00-1.2.7L3.2 3.3 1.5 6.3l1.3 1.1a5 5 0 000 1.4L1.5 9.8l1.7 2.9 1.6-.6a5 5 0 001.2.7l.3 1.7h3.4l.3-1.7a5 5 0 001.2-.7l1.6.6 1.7-2.9-1.3-1.1a5 5 0 000-1.4l1.3-1.1-1.7-2.9-1.6.6A5 5 0 009.1 3.2L8.7 1.5H6.3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
];

type Props = {
  currentPage: string;
  onNavigate: (page: string) => void;
};

export default function Sidebar({ currentPage, onNavigate }: Props) {
  const hasROASAlert = roasAlerts.length > 0;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUserEmail(session.user.email ?? null);
          setCompanyName(session.user.user_metadata?.company_name ?? null);
        }
      });
  }, []);

  const isActive = (item: NavItem) => {
    if (item.page === "integrations") return currentPage === "integrations";
    if (item.page === "settings") return currentPage === "settings";
    if (item.label === "Overview") return currentPage === "overview";
    return false;
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed left-0 top-0 h-full w-[220px] border-r border-[#e5e5e5] bg-white flex flex-col z-10"
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#0a0a0a] rounded flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 9L6 3L10 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#0a0a0a] tracking-tight">
            SourceIQ
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-widest px-2 mb-2">
          Analytics
        </p>
        <ul className="space-y-0.5">
          {navItems.slice(0, 4).map((item) => {
            const active = isActive(item);
            return (
              <li key={item.label}>
                <button
                  onClick={() => !item.disabled && onNavigate(item.page)}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                    active
                      ? "bg-[#f5f5f5] text-[#0a0a0a] font-medium"
                      : item.disabled
                      ? "text-[#d4d4d4] cursor-not-allowed"
                      : "text-[#0a0a0a] hover:bg-[#f5f5f5] cursor-pointer"
                  }`}
                >
                  <span className={active ? "text-[#0a0a0a]" : "text-[#525252]"}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {/* ROAS alert badge */}
                  {item.badge === "roas-alert" && hasROASAlert && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-widest px-2 mb-2 mt-4">
          Setup
        </p>
        <ul className="space-y-0.5">
          {navItems.slice(4).map((item) => {
            const active = isActive(item);
            return (
              <li key={item.label}>
                <button
                  onClick={() => !item.disabled && onNavigate(item.page)}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                    active
                      ? "bg-[#f5f5f5] text-[#0a0a0a] font-medium"
                      : item.disabled
                      ? "text-[#d4d4d4] cursor-not-allowed"
                      : "text-[#0a0a0a] hover:bg-[#f5f5f5] cursor-pointer"
                  }`}
                >
                  <span
                    className={
                      active
                        ? "text-[#0a0a0a]"
                        : item.disabled
                        ? "text-[#d4d4d4]"
                        : "text-[#525252]"
                    }
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[#e5e5e5] relative" ref={menuRef}>
        {/* Logout popup */}
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-[#e5e5e5] rounded-lg shadow-md overflow-hidden z-50">
            <button
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                await createClient().auth.signOut();
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h2.5M8 8.5L10.5 6 8 3.5M10.5 6H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Log out
            </button>
          </div>
        )}

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2 rounded-md px-1 py-1 hover:bg-[#f5f5f5] transition-colors cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#e5e5e5] flex items-center justify-center text-[10px] font-semibold text-[#525252] shrink-0">
            {userEmail ? userEmail[0].toUpperCase() : "—"}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-medium text-[#0a0a0a] truncate">
              {userEmail ?? "—"}
            </p>
            <p className="text-[10px] text-[#a3a3a3] truncate">
              {companyName ?? "My Company"}
            </p>
          </div>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={`shrink-0 text-[#a3a3a3] transition-transform ${menuOpen ? "rotate-180" : ""}`}
          >
            <path d="M2.5 4.5l3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </motion.aside>
  );
}
