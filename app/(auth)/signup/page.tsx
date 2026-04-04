"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = inviteToken ? `/invite/${inviteToken}` : "/onboarding";
  }

  const loginHref = inviteToken ? `/login?invite=${inviteToken}` : "/login";

  return (
    <div className="w-full max-w-sm">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-[#f0f0f0] border border-[#e5e5e5] rounded-xl p-1 mb-8">
        <Link
          href={loginHref}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-[#737373] hover:text-[#404040] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1.5 12c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Login
        </Link>
        <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-white text-[#0a0a0a] shadow-sm">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M0.5 12c0-2.761 2.239-5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M10 7.5v4M8 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Sign Up
        </span>
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight">Create account</h1>
        <p className="mt-1.5 text-sm text-[#737373]">Start tracking what actually moves the needle.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-[#404040] mb-1.5">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e5e5e5] rounded-lg text-[#0a0a0a] placeholder:text-[#b0b0b0] focus:outline-none focus:border-[#a3a3a3] transition-colors"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-[#404040] mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-3.5 pr-10 py-2.5 text-sm bg-white border border-[#e5e5e5] rounded-lg text-[#0a0a0a] placeholder:text-[#b0b0b0] focus:outline-none focus:border-[#a3a3a3] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#404040] transition-colors"
            >
              {showPassword ? (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 2l11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M6.3 5.3A2 2 0 019.7 8.7M4.3 3.3C5.3 2.8 6.4 2.5 7.5 2.5c3 0 5.5 2.7 5.5 5s-.9 2.9-2.3 3.9M3 6.2C2.2 7 1.5 8.1 1 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M1 7.5C1 7.5 3.5 3 7.5 3s6.5 4.5 6.5 4.5S11.5 12 7.5 12 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0a0a0a] hover:bg-[#262626] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-7 text-center text-xs text-[#737373]">
        Already have an account?{" "}
        <Link href={loginHref} className="text-[#0a0a0a] font-medium hover:text-[#404040] transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
