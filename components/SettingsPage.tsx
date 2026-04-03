"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Tab = "account" | "team";

type Member = { id: string; user_id: string; email: string; role: string; created_at: string };
type PendingInvite = { id: string; email: string; role: string; created_at: string; expires_at: string };

const INDUSTRIES = [
  "Home Services", "HVAC / Plumbing / Electrical", "Roofing / Siding / Windows",
  "Solar", "Landscaping / Lawn Care", "Pest Control", "Cleaning Services",
  "Real Estate", "Healthcare / Med Spa", "Auto Dealership", "Retail / E-commerce", "Other",
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("account");

  return (
    <div className="px-6 py-5 max-w-[720px]">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#e5e5e5] mb-6">
          {(["account", "team"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-[#0a0a0a] text-[#0a0a0a]"
                  : "border-transparent text-[#a3a3a3] hover:text-[#525252]"
              }`}
            >
              {t === "account" ? "Account" : "Team"}
            </button>
          ))}
        </div>

        {tab === "account" && <AccountTab />}
        {tab === "team" && <TeamTab />}
      </motion.div>
    </div>
  );
}

// ── Account Tab ───────────────────────────────────────────────────────────────

function AccountTab() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const oid = user.user_metadata?.org_id;
      if (!oid) return;
      setOrgId(oid);
      const { data: org } = await supabase
        .from("organizations")
        .select("name, industry")
        .eq("id", oid)
        .single();
      if (org) {
        setCompanyName(org.name ?? "");
        setIndustry(org.industry ?? "");
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("organizations")
      .update({ name: companyName, industry })
      .eq("id", orgId);
    await supabase.auth.updateUser({ data: { company_name: companyName } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <Section title="Company" description="Update your company name and industry.">
        <Field label="Company name">
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#a3a3a3] transition-colors"
          />
        </Field>
        <Field label="Industry">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#a3a3a3] bg-white transition-colors appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a3a3a3' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
      </Section>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#0a0a0a] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-xs text-emerald-600 font-medium">Saved</span>}
      </div>
    </form>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────

function TeamTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadTeam = useCallback(async () => {
    const res = await fetch("/api/invites");
    if (res.ok) {
      const data = await res.json() as { members: Member[]; pendingInvites: PendingInvite[] };
      setMembers(data.members);
      setPendingInvites(data.pendingInvites);
    }
    setLoadingTeam(false);
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setInviteError(null);
    setInviteLink(null);

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const data = await res.json() as { inviteUrl?: string; error?: string };

    if (!res.ok) {
      setInviteError(data.error ?? "Failed to create invite.");
      setSending(false);
      return;
    }

    setInviteLink(data.inviteUrl ?? null);
    setInviteEmail("");
    setSending(false);
    loadTeam();
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Members list */}
      <Section title="Members" description="People who have access to your organization.">
        {loadingTeam ? (
          <p className="text-xs text-[#a3a3a3]">Loading…</p>
        ) : (
          <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
            {members.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center justify-between px-4 py-3 ${i < members.length - 1 ? "border-b border-[#f5f5f5]" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[10px] font-semibold text-[#525252] shrink-0">
                    {m.email?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-xs text-[#0a0a0a]">{m.email}</span>
                </div>
                <span className="text-[11px] capitalize text-[#a3a3a3] border border-[#e5e5e5] px-2 py-0.5 rounded-full">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <Section title="Pending invites" description="These links expire in 48 hours.">
          <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
            {pendingInvites.map((inv, i) => (
              <div
                key={inv.id}
                className={`flex items-center justify-between px-4 py-3 ${i < pendingInvites.length - 1 ? "border-b border-[#f5f5f5]" : ""}`}
              >
                <span className="text-xs text-[#525252]">{inv.email}</span>
                <span className="text-[11px] text-[#a3a3a3]">Pending</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Invite form */}
      <Section title="Invite teammate" description="Send an invite link to someone on your team.">
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="flex-1 px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#a3a3a3] placeholder:text-[#d4d4d4] transition-colors"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#a3a3a3] bg-white appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a3a3a3' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: "28px" }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {inviteError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {inviteError}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="bg-[#0a0a0a] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50"
          >
            {sending ? "Creating link…" : "Generate invite link"}
          </button>
        </form>

        {/* Show generated link */}
        {inviteLink && (
          <div className="mt-4 p-3 bg-[#f5f5f5] rounded-lg border border-[#e5e5e5]">
            <p className="text-[11px] font-medium text-[#525252] mb-2">Invite link (expires in 48 hours)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] text-[#0a0a0a] truncate">{inviteLink}</code>
              <button
                onClick={() => copyLink(inviteLink)}
                className="text-[11px] font-medium text-[#525252] border border-[#e5e5e5] bg-white px-2.5 py-1 rounded-md hover:border-[#a3a3a3] transition-colors shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-5 border-b border-[#f5f5f5] last:border-0 last:pb-0">
      <div className="mb-3">
        <p className="text-sm font-semibold text-[#0a0a0a]">{title}</p>
        <p className="text-xs text-[#a3a3a3] mt-0.5">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#525252] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
