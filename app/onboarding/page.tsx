"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INDUSTRIES = [
  "Home Services",
  "HVAC / Plumbing / Electrical",
  "Roofing / Siding / Windows",
  "Solar",
  "Landscaping / Lawn Care",
  "Pest Control",
  "Cleaning Services",
  "Real Estate",
  "Healthcare / Med Spa",
  "Auto Dealership",
  "Retail / E-commerce",
  "Other",
];

const ROLES = [
  "Business Owner",
  "Marketing Director",
  "Marketing Manager",
  "Agency / Consultant",
  "Sales Manager",
  "Operations Manager",
  "Other",
];

const TEAM_SIZES = ["Just me", "2–5", "6–15", "16–50", "50+"];

const CHANNELS = [
  { id: "google_ads", label: "Google Ads" },
  { id: "facebook_ads", label: "Facebook / Meta Ads" },
  { id: "lsa", label: "Local Service Ads (LSA)" },
  { id: "seo", label: "Organic / SEO" },
  { id: "referrals", label: "Referrals" },
  { id: "email", label: "Email Marketing" },
  { id: "direct_mail", label: "Direct Mail" },
  { id: "home_shows", label: "Home Shows / Events" },
  { id: "yard_signs", label: "Yard Signs / Door Hangers" },
  { id: "tv_radio", label: "TV / Radio" },
];

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");

  // Step 2
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");

  // Step 3
  const [channels, setChannels] = useState<string[]>([]);

  function toggleChannel(id: string) {
    setChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Upsert profile row
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      company_name: companyName,
      industry,
      role,
      team_size: teamSize,
      marketing_channels: channels,
      onboarding_completed: true,
    });

    if (profileError) {
      setError("Something went wrong saving your profile. Please try again.");
      setSaving(false);
      return;
    }

    // Mark onboarding complete in auth metadata so the proxy can read it
    await supabase.auth.updateUser({
      data: { onboarding_completed: true, company_name: companyName },
    });

    router.push("/dashboard");
  }

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-full bg-[#fafafa] flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#e5e5e5] bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#0a0a0a] rounded-md flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 10l3-6 2 4 2-2 3 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#0a0a0a]">ROI Dashboard</span>
        </div>
        <span className="text-xs text-[#a3a3a3]">Step {step} of 3</span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-[#f5f5f5]">
        <div
          className="h-full bg-[#0a0a0a] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {step === 1 && (
            <StepOne
              companyName={companyName}
              setCompanyName={setCompanyName}
              industry={industry}
              setIndustry={setIndustry}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepTwo
              role={role}
              setRole={setRole}
              teamSize={teamSize}
              setTeamSize={setTeamSize}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepThree
              channels={channels}
              onToggle={toggleChannel}
              onBack={() => setStep(2)}
              onFinish={handleFinish}
              saving={saving}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Company ───────────────────────────────────────────────────────────

function StepOne({
  companyName,
  setCompanyName,
  industry,
  setIndustry,
  onNext,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
  onNext: () => void;
}) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-[#0a0a0a]">Tell us about your business</h1>
        <p className="mt-1 text-xs text-[#737373]">We&apos;ll use this to personalize your dashboard.</p>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#525252] mb-1.5">
              Company name
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Roofing Co."
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#a3a3a3] placeholder:text-[#d4d4d4] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#525252] mb-1.5">
              Industry
            </label>
            <select
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#a3a3a3] bg-white transition-colors appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a3a3a3' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
            >
              <option value="" disabled>Select your industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0a0a0a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#262626] transition-colors mt-2"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Step 2: Role ──────────────────────────────────────────────────────────────

function StepTwo({
  role,
  setRole,
  teamSize,
  setTeamSize,
  onBack,
  onNext,
}: {
  role: string;
  setRole: (v: string) => void;
  teamSize: string;
  setTeamSize: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-[#0a0a0a]">Your role</h1>
        <p className="mt-1 text-xs text-[#737373]">Help us understand how you&apos;ll use the dashboard.</p>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#525252] mb-1.5">
              Your role
            </label>
            <select
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#a3a3a3] bg-white transition-colors appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a3a3a3' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
            >
              <option value="" disabled>Select your role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#525252] mb-2">
              Team size
            </label>
            <div className="flex gap-2 flex-wrap">
              {TEAM_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTeamSize(size)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    teamSize === size
                      ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                      : "bg-white text-[#525252] border-[#e5e5e5] hover:border-[#a3a3a3]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-white text-[#525252] text-sm font-medium py-2.5 rounded-lg border border-[#e5e5e5] hover:border-[#a3a3a3] transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!teamSize}
              className="flex-1 bg-[#0a0a0a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Step 3: Channels ──────────────────────────────────────────────────────────

function StepThree({
  channels,
  onToggle,
  onBack,
  onFinish,
  saving,
  error,
}: {
  channels: string[];
  onToggle: (id: string) => void;
  onBack: () => void;
  onFinish: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-[#0a0a0a]">Which channels do you run?</h1>
        <p className="mt-1 text-xs text-[#737373]">Select all that apply — you can always add more later.</p>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 shadow-sm">
        <div className="space-y-2 mb-5">
          {CHANNELS.map((ch) => {
            const selected = channels.includes(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onToggle(ch.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  selected
                    ? "bg-[#f5f5f5] border-[#a3a3a3] text-[#0a0a0a]"
                    : "bg-white border-[#e5e5e5] text-[#525252] hover:border-[#a3a3a3]"
                }`}
              >
                <span className="text-sm">{ch.label}</span>
                {selected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" fill="#0a0a0a" />
                    <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="flex-1 bg-white text-[#525252] text-sm font-medium py-2.5 rounded-lg border border-[#e5e5e5] hover:border-[#a3a3a3] transition-colors disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onFinish}
            disabled={saving || channels.length === 0}
            className="flex-1 bg-[#0a0a0a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Setting up…" : "Go to dashboard →"}
          </button>
        </div>
      </div>
    </div>
  );
}
