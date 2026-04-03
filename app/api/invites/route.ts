import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

// GET /api/invites — list members and pending invites for the caller's org
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

  const [membersResult, invitesResult] = await Promise.all([
    supabase
      .from("members")
      .select("id, user_id, email, role, created_at")
      .eq("org_id", orgId)
      .order("created_at"),
    supabase
      .from("invites")
      .select("id, email, role, created_at, expires_at, accepted_at")
      .eq("org_id", orgId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    members: membersResult.data ?? [],
    pendingInvites: invitesResult.data ?? [],
  });
}

// POST /api/invites — create a new invite
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

  const body = await request.json();
  const { email, role = "member" } = body as { email: string; role?: string };

  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  // Check if already a member
  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("org_id", orgId)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "This person is already a member of your organization." }, { status: 409 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours

  const { error } = await supabase.from("invites").insert({
    org_id: orgId,
    email,
    role,
    token,
    invited_by: user.id,
    expires_at: expiresAt,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to create invite." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;

  return NextResponse.json({ inviteUrl, expiresAt });
}
