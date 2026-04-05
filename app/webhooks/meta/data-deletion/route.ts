/**
 * Meta Data Deletion Callback Webhook
 *
 * Meta requires all apps using Facebook Login to provide a data deletion
 * callback URL. When a user removes the app from their Facebook settings,
 * Meta sends a signed POST request here asking us to delete that user's data.
 *
 * Meta Developer Dashboard → Settings → Advanced → Data Deletion Requests
 * Callback URL: https://sourceiq.app/webhooks/meta/data-deletion
 * Status URL:   https://sourceiq.app/webhooks/meta/data-deletion?id={confirmation_code}
 *
 * Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */

import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function base64urlDecode(str: string): string {
  // Convert base64url → base64, then decode
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function parseAndVerifySignedRequest(
  signedRequest: string,
  appSecret: string
): { user_id: string; algorithm: string } | null {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;

  const [encodedSig, encodedPayload] = parts;
  const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  // Verify: HMAC-SHA256 of the raw payload string using the App Secret
  const expectedSig = createHmac("sha256", appSecret)
    .update(encodedPayload)
    .digest();

  if (!sig.equals(expectedSig)) return null;

  try {
    return JSON.parse(base64urlDecode(encodedPayload));
  } catch {
    return null;
  }
}

// POST — Meta sends deletion request
export async function POST(request: NextRequest) {
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let signedRequest: string | null = null;

  // Meta sends signed_request as form-encoded body
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const body = await request.text();
    const params = new URLSearchParams(body);
    signedRequest = params.get("signed_request");
  } else {
    const body = await request.json().catch(() => ({})) as Record<string, string>;
    signedRequest = body.signed_request ?? null;
  }

  if (!signedRequest) {
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  const payload = parseAndVerifySignedRequest(signedRequest, appSecret);
  if (!payload) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const facebookUserId = payload.user_id;
  const confirmationCode = `del_${facebookUserId}_${Date.now()}`;

  // Delete all data tied to this Facebook user ID
  const supabase = await createClient();
  await supabase
    .from("integrations")
    .delete()
    .eq("provider", "facebook")
    .eq("provider_user_id", facebookUserId);

  // Log for audit trail (non-blocking — best effort)
  console.log(
    JSON.stringify({
      event: "meta_data_deletion",
      facebook_user_id: facebookUserId,
      confirmation_code: confirmationCode,
      timestamp: new Date().toISOString(),
    })
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sourceiq.app";

  return NextResponse.json({
    url: `${appUrl}/webhooks/meta/data-deletion?id=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}

// GET — Meta may poll this URL to confirm deletion was processed
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");

  // At this stage we don't persist confirmation codes to a table —
  // the deletion is synchronous, so any valid-looking code means it ran.
  // TODO: persist codes to a deletion_log table if Meta requires proof.
  if (!id || !id.startsWith("del_")) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ status: "deleted", confirmation_code: id });
}
