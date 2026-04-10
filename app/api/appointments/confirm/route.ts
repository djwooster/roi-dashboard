import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/appointments/confirm
// Allows a med spa owner to confirm whether a patient showed up or no-showed.
// Auth: the report token (unguessable 32-char hex) substitutes for user auth here —
// the same pattern the /report/[token] page uses. No login required so the med spa
// owner can tap "Showed" / "No Show" directly from their weekly report link.
//
// Why admin client: the report page is public (no session cookie), and we need to
// look up the report row + upsert the confirmation in a single server-side call.
// RLS isn't usable without a session, so we validate via the token instead.
export async function POST(request: NextRequest) {
  let body: {
    token: string;
    ghl_appointment_id: string;
    outcome: "showed" | "no_show";
    contact_name?: string;
    appointment_at?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, ghl_appointment_id, outcome, contact_name, appointment_at } = body;

  if (!token || !ghl_appointment_id || !outcome) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (outcome !== "showed" && outcome !== "no_show") {
    return NextResponse.json({ error: "outcome must be showed or no_show" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Validate the token against the reports table — this is the access control check.
  // If the token is invalid or not found, return 403 so we don't leak org/location info.
  const { data: report } = await admin
    .from("reports")
    .select("org_id, location_id")
    .eq("token", token)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Upsert the confirmation — the UNIQUE constraint on (org_id, ghl_appointment_id)
  // prevents duplicate rows and allows the med spa owner to change their answer
  // (e.g. initially "no_show" then corrects to "showed").
  const { error } = await admin
    .from("appointment_confirmations")
    .upsert(
      {
        org_id: report.org_id,
        location_id: report.location_id,
        ghl_appointment_id,
        outcome,
        contact_name: contact_name ?? null,
        appointment_at: appointment_at ?? null,
        confirmed_at: new Date().toISOString(),
      },
      { onConflict: "org_id,ghl_appointment_id" },
    );

  if (error) {
    console.error("[appointments/confirm] upsert error:", error);
    return NextResponse.json({ error: "Failed to save confirmation" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
