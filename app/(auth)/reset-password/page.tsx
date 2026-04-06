"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronUp } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="w-10 h-10 bg-black/8 border border-black/12 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <ChevronUp size={20} color="#0a0a0a" strokeWidth={2.5} />
        </div>
      </div>

      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-[#0a0a0a]/50">Choose something you haven&apos;t used before.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#0a0a0a]/60 mb-1.5">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 text-sm bg-black/5 border border-black/12 rounded-lg text-[#0a0a0a] placeholder:text-[#0a0a0a]/30 focus:outline-none focus:border-black/30 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#0a0a0a]/60 mb-1.5">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
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
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
