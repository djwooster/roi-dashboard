"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleChannel(id: string) {
    setChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await save();
  }

  async function handleSkip() {
    await save();
  }

  async function save() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: companyName || "My Company", created_by: user.id })
      .select("id")
      .single();

    if (orgError) {
      setError("Something went wrong creating your organization. Please try again.");
      setSaving(false);
      return;
    }

    // Add user as owner member
    const { error: memberError } = await supabase
      .from("members")
      .insert({ org_id: org.id, user_id: user.id, email: user.email, role: "owner" });

    if (memberError) {
      setError("Something went wrong setting up your account. Please try again.");
      setSaving(false);
      return;
    }

    // Upsert profile row
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      company_name: companyName || "My Company",
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
      data: {
        onboarding_completed: true,
        company_name: companyName || "My Company",
        org_id: org.id,
      },
    });

    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#e5e5e5] bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#0a0a0a] rounded-md flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 10l3-6 2 4 2-2 3 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#0a0a0a]">SourceIQ</span>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          disabled={saving}
          className="flex items-center gap-1 text-xs text-[#a3a3a3] hover:text-[#525252] transition-colors disabled:opacity-40"
        >
          Skip setup
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-7">
            <h1 className="text-xl font-semibold text-[#0a0a0a]">Set up your workspace</h1>
            <p className="mt-1 text-xs text-[#737373]">Takes about 30 seconds — you can always update this later.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm divide-y divide-[#f5f5f5]">

              {/* Company name */}
              <div className="px-5 py-4">
                <label className="block text-xs font-medium text-[#525252] mb-2">
                  Company name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Roofing Co."
                  className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#a3a3a3] placeholder:text-[#d4d4d4] transition-colors"
                />
              </div>

              {/* Role */}
              <div className="px-5 py-4">
                <label className="block text-xs font-medium text-[#525252] mb-2">
                  Your role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#a3a3a3] bg-white transition-colors appearance-none"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a3a3a3' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                >
                  <option value="">Select your role</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Team size */}
              <div className="px-5 py-4">
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

              {/* Channels */}
              <div className="px-5 py-4">
                <label className="block text-xs font-medium text-[#525252] mb-2">
                  Which channels do you run? <span className="text-[#a3a3a3] font-normal">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((ch) => {
                    const selected = channels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleChannel(ch.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          selected
                            ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                            : "bg-white text-[#525252] border-[#e5e5e5] hover:border-[#a3a3a3]"
                        }`}
                      >
                        {selected && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {error && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full bg-[#0a0a0a] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Setting up your workspace…" : "Get started →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
