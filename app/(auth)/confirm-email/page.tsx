"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailForm />
    </Suspense>
  );
}

function ConfirmEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setResent(false);
    const supabase = createClient();
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    setResent(true);
    setCooldown(60);
  }

  useEffect(() => {
    if (cooldown === 0) return;
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-6 h-6 bg-[#0a0a0a] rounded-md flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M2 10l3-6 2 4 2-2 3 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-[#0a0a0a]">SourceIQ</span>
      </div>

      {/* Email icon */}
      <div className="w-11 h-11 bg-[#f5f5f5] rounded-xl flex items-center justify-center mb-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="4" width="20" height="16" rx="2" stroke="#0a0a0a" strokeWidth="1.5" />
          <path d="M2 8l10 6 10-6" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-[#737373] leading-relaxed">
          We sent a confirmation link to{" "}
          {email
            ? <span className="font-medium text-[#0a0a0a]">{email}</span>
            : "your email address"
          }.
          {" "}Click it to activate your account and get started.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="w-full bg-[#0a0a0a] hover:bg-[#262626] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending
            ? "Sending…"
            : cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Resend confirmation email"}
        </button>

        {resent && (
          <p className="text-xs text-center text-emerald-600 font-medium">
            Email resent — check your inbox.
          </p>
        )}

        <p className="text-xs text-center text-[#737373]">
          Wrong email?{" "}
          <Link
            href="/signup"
            className="text-[#0a0a0a] font-medium hover:text-[#404040] transition-colors"
          >
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
