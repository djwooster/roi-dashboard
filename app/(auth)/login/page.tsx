"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (inviteToken) {
      router.push(`/invite/${inviteToken}`);
      return;
    }

    const onboardingDone = data.user?.user_metadata?.onboarding_completed === true;
    router.push(onboardingDone ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex flex-col items-center mb-7">
        <div className="w-12 h-12 bg-[#141414] border border-[#2a2a2a] rounded-xl flex items-center justify-center mb-5 shadow-lg">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 16l4.5-9 3.5 6.5 3-4 4 6.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
        <p className="mt-1.5 text-sm text-[#737373]">
          Don&apos;t have an account?{" "}
          <Link
            href={inviteToken ? `/signup?invite=${inviteToken}` : "/signup"}
            className="text-white font-semibold hover:text-[#a3a3a3] transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#525252]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M1 4.5l6 3.5 6-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email address"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder:text-[#525252] focus:outline-none focus:border-[#404040] transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#525252]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2.5" y="6" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="7" cy="9.5" r="1" fill="currentColor" />
              </svg>
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder:text-[#525252] focus:outline-none focus:border-[#404040] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[11px] text-[#525252] hover:text-[#a3a3a3] transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
