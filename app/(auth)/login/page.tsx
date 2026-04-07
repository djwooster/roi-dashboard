"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronUp } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
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

  async function handleOAuth(provider: "google" | "github") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const signupHref = inviteToken ? `/signup?invite=${inviteToken}` : "/signup";

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-10 h-10 bg-black/8 border border-black/12 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <ChevronUp size={20} color="#0a0a0a" strokeWidth={2.5} />
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight">Log in to <Link href="/" className="hover:opacity-60 transition-opacity">SourceIQ</Link></h1>
        <p className="mt-2 text-sm text-[#0a0a0a]/50">
          Don&apos;t have an account?{" "}
          <Link href={signupHref} className="text-[#0a0a0a] font-medium hover:text-[#0a0a0a]/70 transition-colors">
            Sign up
          </Link>
        </p>
      </div>

      {/* OAuth */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black/5 hover:bg-black/10 border border-black/12 text-[#0a0a0a] text-sm font-medium rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("github")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black/5 hover:bg-black/10 border border-black/12 text-[#0a0a0a] text-sm font-medium rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0a">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          GitHub
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-black/12" />
        <span className="text-xs text-[#0a0a0a]/40">or</span>
        <div className="flex-1 h-px bg-black/12" />
      </div>

      {/* Form */}
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-[#0a0a0a]/60">Password</label>
            <Link href="/forgot-password" className="text-[11px] text-[#0a0a0a]/40 hover:text-[#0a0a0a]/60 transition-colors">
              Forgot your password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 pr-11 py-3 text-sm bg-black/5 border border-black/12 rounded-lg text-[#0a0a0a] placeholder:text-[#0a0a0a]/30 focus:outline-none focus:border-black/30 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 transition-colors"
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
          <p className="text-xs text-red-300 bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0a0a0a] hover:bg-[#0a0a0a]/85 text-white text-sm font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Log In"}
        </button>
      </form>
    </div>
  );
}
