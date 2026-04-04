"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronUp } from "lucide-react";

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
    <div className="w-full">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-10 h-10 bg-black/8 border border-black/12 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <ChevronUp size={20} color="#0a0a0a" strokeWidth={2.5} />
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-[#0a0a0a]/50 leading-relaxed">
          We sent a confirmation link to{" "}
          {email
            ? <span className="font-medium text-[#0a0a0a]">{email}</span>
            : "your email address"
          }.
          {" "}Click it to activate your account.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="w-full bg-[#0a0a0a] hover:bg-[#0a0a0a]/85 text-white text-sm font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        <p className="text-xs text-center text-[#0a0a0a]/40">
          Wrong email?{" "}
          <Link href="/signup" className="text-[#0a0a0a]/60 font-medium hover:text-[#0a0a0a] transition-colors">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
