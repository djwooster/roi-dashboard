import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// POST /api/webhooks/stripe
// Receives lifecycle events from Stripe and keeps the org's subscription status in sync.
//
// Why force-dynamic:
// Next.js caches route handlers by default. Stripe webhooks must never be served
// from cache — each event is a unique real-time signal that must hit our handler.
//
// Why we verify the signature before anything else:
// This endpoint is public (no auth). Signature verification proves the request
// genuinely came from Stripe and not a spoofed POST. Without this, anyone could
// fake a "subscription.updated" event and unlock a paid plan for free.
//
// Why we return 500 on DB errors (instead of 200):
// Stripe treats a non-2xx response as a delivery failure and retries the event.
// All our DB updates are idempotent (same data in = same state), so retries are
// safe. Swallowing errors with 200 would silently drop events and leave orgs in
// the wrong billing state with no way to recover.
export const dynamic = "force-dynamic";

type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled";

// Maps Stripe's subscription statuses to our simplified internal set.
// We collapse "unpaid" and "incomplete_expired" into "canceled" because from
// the app's perspective they both mean the subscription is over.
function toStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case "active": return "active";
    case "trialing": return "trialing";
    case "past_due": return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default: return "inactive";
  }
}

async function updateOrgSubscription(orgId: string, update: {
  stripe_subscription_status: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
}) {
  const admin = createAdminClient();

  // Update the organizations table — source of truth for billing state.
  const { error } = await admin.from("organizations").update(update).eq("id", orgId);
  // Throw on DB failure so the caller returns 500 and Stripe retries the event.
  if (error) throw new Error(`DB update failed for org ${orgId}: ${error.message}`);

  // Also mirror the subscription status into the owner's auth metadata so
  // proxy.ts can enforce billing on every request without a DB round-trip.
  // We look up the owner via the members table (role = 'owner').
  // Non-fatal: if this fails, the DB is still correct and the user's JWT will
  // reflect the new status after their next session refresh (up to ~1hr delay).
  try {
    const { data: member } = await admin
      .from("members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("role", "owner")
      .single();

    if (member?.user_id) {
      await admin.auth.admin.updateUserById(member.user_id, {
        user_metadata: { stripe_subscription_status: update.stripe_subscription_status },
      });
    }
  } catch {
    // Non-fatal — don't let a metadata sync failure block the webhook response
  }
}

export async function POST(request: NextRequest) {
  // Stripe sends a raw body — we must read it as bytes before any parsing.
  // Using arrayBuffer() + Buffer ensures the body is never touched by Next.js's
  // JSON middleware, which would break the HMAC signature check.
  const body = Buffer.from(await request.arrayBuffer()).toString("utf-8");
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        // Fired once after the user completes the Stripe Checkout form.
        // We retrieve the full subscription (not just the session) to get
        // metadata.org_id, which is stored on subscription_data at session creation.
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const orgId = subscription.metadata?.org_id ?? (session.metadata?.org_id as string | undefined);
        if (!orgId) break;

        await updateOrgSubscription(orgId, {
          stripe_subscription_status: toStatus(subscription.status),
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price.id,
        });
        break;
      }

      case "customer.subscription.updated": {
        // Fired on any subscription change: plan upgrade, downgrade, renewal, trial end.
        // org_id lives in subscription.metadata (set at checkout via subscription_data.metadata).
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;
        if (!orgId) break;

        await updateOrgSubscription(orgId, {
          stripe_subscription_status: toStatus(subscription.status),
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price.id,
        });
        break;
      }

      case "customer.subscription.deleted": {
        // Fired when a subscription is fully canceled (end of billing period after cancel,
        // or immediately if canceled with proration). Sets status to "canceled" which
        // triggers the billing gate in proxy.ts to redirect the user to /billing.
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;
        if (!orgId) break;

        await updateOrgSubscription(orgId, {
          stripe_subscription_status: "canceled",
          stripe_subscription_id: subscription.id,
        });
        break;
      }

      case "invoice.payment_failed": {
        // Fired when a recurring charge fails (expired card, insufficient funds, etc.).
        // Sets status to "past_due" — the billing gate in proxy.ts will warn the user
        // but not hard-block them immediately, giving them time to update their card.
        //
        // Why the intersection type: the Stripe SDK's Invoice type for API version
        // 2025-03-31.basil renamed invoice.subscription — the intersection lets us
        // access it without a type error until the SDK types stabilize.
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        const subId = invoice.subscription ?? null;
        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        const orgId = subscription.metadata?.org_id;
        if (!orgId) break;

        await updateOrgSubscription(orgId, {
          stripe_subscription_status: "past_due",
        });
        break;
      }
    }
  } catch (err) {
    // Return 500 so Stripe retries. All DB updates above are idempotent.
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
