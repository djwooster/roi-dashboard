import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/oauth-config";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!OAUTH_PROVIDERS[provider as OAuthProvider]) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  await supabase
    .from("integrations")
    .update({ status: "inactive" })
    .eq("org_id", orgId)
    .eq("provider", provider);

  return NextResponse.json({ ok: true });
}
