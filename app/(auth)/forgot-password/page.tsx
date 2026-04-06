"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChevronUp } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-10 h-10 bg-black/8 border border-black/12 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <ChevronUp size={20} color="#0a0a0a" strokeWidth={2.5} />
        </div>
      </div>

      {sent ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight mb-3">Check your email</h1>
          <p className="text-sm text-[#0a0a0a]/50 mb-8">
            We sent a password reset link to <span className="font-medium text-[#0a0a0a]/70">{email}</span>.
            Check your spam folder if it doesn&apos;t arrive within a minute.
          </p>
          <Link
            href="/login"
            className="text-sm text-[#0a0a0a]/50 hover:text-[#0a0a0a]/70 transition-colors"
          >
            ← Back to log in
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight">Reset your password</h1>
            <p className="mt-2 text-sm text-[#0a0a0a]/50">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#0a0a0a]/60 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 text-sm bg-black/5 border border-black/12 rounded-lg text-[#0a0a0a] placeholder:text-[#0a0a0a]/30 focus:outline-none focus:border-black/30 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-300 bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0a0a0a] hover:bg-[#0a0a0a]/85 text-white text-sm font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-[#0a0a0a]/50">
            <Link href="/login" className="text-[#0a0a0a] font-medium hover:text-[#0a0a0a]/70 transition-colors">
              ← Back to log in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
