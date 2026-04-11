import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidLocationToken } from "@/lib/ghl/getValidLocationToken";
import { getValidGHLToken } from "@/lib/ghl/getValidToken";
import { ghlPut } from "@/lib/ghl/api";

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

  // Write the outcome back to GHL so agency automations (re-booking sequences,
  // follow-ups) can trigger on the correct status. after() guarantees this runs
  // after the response is sent without blocking the client — safer than an IIFE
  // on serverless where the runtime can terminate before an unawaited promise resolves.
  // GHL uses "noshow" (no underscore) while we use "no_show" internally.
  after(async () => {
    try {
      // Try location-specific token first (sub-account OAuth stored in ghl_locations),
      // then fall back to the org-level token in integrations (single-location connect).
      // Mirrors the same fallback logic in the sync route.
      const ghlToken =
        (await getValidLocationToken(report.org_id, report.location_id)) ??
        await getValidGHLToken(report.org_id).catch(() => null);

      if (!ghlToken) {
        console.error("[appointments/confirm] GHL write-back: no token for location", report.location_id);
        return;
      }

      const ghlStatus = outcome === "showed" ? "showed" : "noshow";
      const res = await ghlPut(
        `/calendars/events/appointments/${ghl_appointment_id}`,
        ghlToken,
        { appointmentStatus: ghlStatus },
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "(unreadable)");
        console.error(`[appointments/confirm] GHL write-back ${res.status}:`, body);
      } else {
        console.log(`[appointments/confirm] GHL write-back ok — ${ghl_appointment_id} → ${ghlStatus}`);
      }
    } catch (err) {
      console.error("[appointments/confirm] GHL write-back threw:", err);
    }
  });

  return NextResponse.json({ success: true });
}
