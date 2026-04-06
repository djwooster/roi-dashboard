import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /auth/callback — exchanges a Supabase auth code for a session and
// redirects to the intended destination (default: /onboarding)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  // Recovery emails land here with type=recovery — send to reset password page
  const next = type === "recovery"
    ? "/reset-password"
    : (searchParams.get("next") ?? "/onboarding");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
