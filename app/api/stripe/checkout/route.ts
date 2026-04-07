import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

// POST /api/stripe/checkout
// Creates a Stripe Checkout session for the org's subscription.
//
// Why we use the admin client for DB writes here:
// The user-scoped Supabase client respects RLS, but updating stripe_customer_id
// on the organizations table requires elevated access. The admin client bypasses
// RLS and is safe here because we've already verified the user's identity via
// getUser() before touching the DB.

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("stripe_customer_id, name")
    .eq("id", orgId)
    .single();

  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  try {
    // --- Customer resolution ---
    // We store the Stripe customer ID on the org so we don't create duplicate
    // customers (Stripe charges per customer and duplicate records make billing
    // history messy). However, stored IDs can go stale when:
    //   - switching between Stripe test mode and live mode (different ID spaces)
    //   - a customer was manually deleted in the Stripe dashboard
    // We validate before reusing and fall back to creating a new one if invalid.

    let customerId = org.stripe_customer_id as string | null;

    if (customerId) {
      const existing = await stripe.customers.retrieve(customerId);

      // retrieve() returns { deleted: true } instead of throwing for deleted customers.
      // We must check this explicitly — a deleted customer will cause session.create to fail.
      if ((existing as Stripe.DeletedCustomer).deleted) {
        customerId = null;
        await admin.from("organizations").update({ stripe_customer_id: null }).eq("id", orgId);
      }
    }

    if (!customerId) {
      // New customer — store the ID immediately so future checkout attempts reuse it.
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: { org_id: orgId },  // org_id on the customer lets us recover the link if webhook metadata is ever missing
      });
      customerId = customer.id;
      await admin
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", orgId);
    }

    // --- Checkout session ---
    // subscription_data.metadata.org_id is how the webhook identifies which org
    // to update after payment. This is more reliable than session.metadata because
    // the webhook fires on subscription events (not session events) after the first payment.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      subscription_data: {
        metadata: { org_id: orgId },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
