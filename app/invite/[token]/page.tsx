"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type InviteState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "needs_auth"; token: string }
  | { status: "ready"; orgName: string; inviterEmail: string; role: string; token: string }
  | { status: "accepted" };

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<InviteState>({ status: "loading" });
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState({ status: "needs_auth", token });
        return;
      }

      // Validate the token by calling the accept endpoint with a dry-run check
      // For now, just show the accept UI — the accept API will validate
      setState({
        status: "ready",
        orgName: "your organization",
        inviterEmail: "",
        role: "member",
        token,
      });
    }
    check();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);

    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json() as { success?: boolean; error?: string };

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setAccepting(false);
      return;
    }

    setState({ status: "accepted" });
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (state.status === "loading") {
    return <InviteShell><p className="text-sm text-[#a3a3a3] text-center">Checking invite…</p></InviteShell>;
  }

  if (state.status === "invalid") {
    return (
      <InviteShell>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-[#0a0a0a]">This invite is no longer valid</p>
          <p className="text-xs text-[#a3a3a3]">It may have expired or already been used.</p>
          <Link href="/signup" className="inline-block mt-3 text-xs font-medium text-[#525252] underline underline-offset-2">
            Create a new account instead
          </Link>
        </div>
      </InviteShell>
    );
  }

  if (state.status === "needs_auth") {
    return (
      <InviteShell>
        <div className="text-center space-y-1 mb-6">
          <p className="text-base font-semibold text-[#0a0a0a]">You&apos;ve been invited</p>
          <p className="text-xs text-[#737373]">Sign in or create an account to join your team.</p>
        </div>
        <div className="space-y-2">
          <Link
            href={`/signup?invite=${state.token}`}
            className="block w-full text-center bg-[#0a0a0a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#262626] transition-colors"
          >
            Create account
          </Link>
          <Link
            href={`/login?invite=${state.token}`}
            className="block w-full text-center bg-white text-[#525252] text-sm font-medium py-2.5 rounded-lg border border-[#e5e5e5] hover:border-[#a3a3a3] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </InviteShell>
    );
  }

  if (state.status === "accepted") {
    return (
      <InviteShell>
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 9l3.5 3.5L14 6" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#0a0a0a]">You&apos;re in!</p>
          <p className="text-xs text-[#a3a3a3]">Redirecting to your dashboard…</p>
        </div>
      </InviteShell>
    );
  }

  // ready state
  return (
    <InviteShell>
      <div className="text-center mb-6">
        <p className="text-base font-semibold text-[#0a0a0a]">You&apos;ve been invited</p>
        <p className="text-xs text-[#737373] mt-1">
          Accept to join your team&apos;s SourceIQ workspace.
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <button
        onClick={handleAccept}
        disabled={accepting}
        className="w-full bg-[#0a0a0a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50"
      >
        {accepting ? "Joining…" : "Accept invite →"}
      </button>
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-[#fafafa] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0a0a0a] rounded-md flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 10l3-6 2 4 2-2 3 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#0a0a0a]">SourceIQ</span>
          </div>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
