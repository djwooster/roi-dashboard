import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/invites/accept — accept an invite by token
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await request.json() as { token: string };
  if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 });

  // Look up the invite
  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "This invite link is invalid or has expired." },
      { status: 404 }
    );
  }

  // Add user to the org as a member
  const { error: memberError } = await supabase.from("members").insert({
    org_id: invite.org_id,
    user_id: user.id,
    email: user.email,
    role: invite.role,
  });

  if (memberError && memberError.code !== "23505") {
    // 23505 = unique violation (already a member), which is fine
    return NextResponse.json({ error: "Failed to add you to the organization." }, { status: 500 });
  }

  // Mark invite as accepted
  await supabase
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Store org_id in user metadata so the proxy can see it
  await supabase.auth.updateUser({
    data: { org_id: invite.org_id, onboarding_completed: true },
  });

  return NextResponse.json({ success: true });
}
