import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Stripe sends the raw body — do not parse as JSON before signature verification
export const dynamic = "force-dynamic";

type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled";

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
  await admin.from("organizations").update(update).eq("id", orgId);
}

export async function POST(request: NextRequest) {
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session.subscription) break;

      // org_id is stored on the subscription metadata (set via subscription_data.metadata at checkout creation)
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

  return NextResponse.json({ received: true });
}
