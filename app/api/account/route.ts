import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/account — permanently deletes the authenticated user and their org data
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const orgId = user.user_metadata?.org_id as string | undefined;

  // Clean up org data so the email can re-register fresh
  if (orgId) {
    await admin.from("members").delete().eq("org_id", orgId);
    await admin.from("invites").delete().eq("org_id", orgId);
    await admin.from("organizations").delete().eq("id", orgId);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
