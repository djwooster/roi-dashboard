"use client";

import { useState } from "react";
import { ChevronUp, Check } from "lucide-react";

const FEATURES = [
  "Connect unlimited GHL sub-accounts",
  "Pipeline funnel + appointment conversion tracking",
  "Multi-offer comparison (per-funnel breakdown)",
  "Facebook Ads attribution",
  "Client-ready export reports (PDF + shareable link)",
  "Close rate + average deal value insights",
  "Cross-platform attribution (Meta → GHL)",
  "Priority support",
];

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-7 h-7 bg-[#0a0a0a] rounded flex items-center justify-center">
          <ChevronUp size={14} color="white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold text-[#0a0a0a] tracking-tight">SourceIQ</span>
      </div>

      <div className="w-full max-w-md">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight mb-2">
            Start your subscription
          </h1>
          <p className="text-sm text-[#525252]">
            Everything you need to see what&apos;s working across all your clients.
          </p>
        </div>

        {/* Plan card */}
        <div className="border border-[#e5e5e5] rounded-xl overflow-hidden">
          {/* Price */}
          <div className="px-6 py-6 border-b border-[#e5e5e5]">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-[#0a0a0a] tracking-tight">$297</span>
              <span className="text-sm text-[#a3a3a3]">/ month</span>
            </div>
            <p className="text-xs text-[#a3a3a3] mt-1">Cancel anytime. No contracts.</p>
          </div>

          {/* Features */}
          <div className="px-6 py-5 space-y-3">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-2.5">
                <Check size={13} className="text-[#0a0a0a] mt-0.5 shrink-0" strokeWidth={2.5} />
                <span className="text-sm text-[#525252]">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            {error && (
              <p className="text-xs text-red-500 mb-3">{error}</p>
            )}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-[#0a0a0a] hover:bg-[#0a0a0a]/85 text-white text-sm font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Redirecting to checkout…" : "Get started"}
            </button>
            <p className="text-center text-[11px] text-[#a3a3a3] mt-3">
              Secured by Stripe. Your card info never touches our servers.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#a3a3a3] mt-6">
          Questions?{" "}
          <a href="mailto:hello@sourceiq.app" className="text-[#525252] hover:text-[#0a0a0a] transition-colors">
            hello@sourceiq.app
          </a>
        </p>
      </div>
    </div>
  );
}
