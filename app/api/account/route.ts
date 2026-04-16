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

  // Clean up all data before deleting the auth user.
  // Order matters: child tables (FK dependencies) must be deleted before parents,
  // and profiles must be deleted before the auth user or Supabase will reject deleteUser.
  if (orgId) {
    // Child tables first — these reference organizations or ghl_locations
    await admin.from("appointment_confirmations").delete().eq("org_id", orgId);
    await admin.from("metrics").delete().eq("org_id", orgId);
    await admin.from("ghl_locations").delete().eq("org_id", orgId);
    await admin.from("reports").delete().eq("org_id", orgId);
    await admin.from("integrations").delete().eq("org_id", orgId);
    await admin.from("members").delete().eq("org_id", orgId);
    await admin.from("invites").delete().eq("org_id", orgId);
    // Parent org row last
    await admin.from("organizations").delete().eq("id", orgId);
  }

  // profiles is user-scoped (FK to auth.users) — must be deleted before deleteUser
  await admin.from("profiles").delete().eq("id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
