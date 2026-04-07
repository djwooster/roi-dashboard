import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/portal
// Creates a Stripe Billing Portal session for the authenticated user's org.
//
// The Billing Portal is a Stripe-hosted page where customers can:
//   - Update their payment method
//   - View invoice history
//   - Cancel their subscription
//
// We redirect to it (rather than building our own billing UI) because Stripe
// handles PCI compliance, card validation, and cancellation flows for us.
// The return_url brings the user back to the dashboard after they're done.

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = user.user_metadata?.org_id;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  // Use admin client — same reason as checkout: reading stripe_customer_id
  // from organizations requires elevated access beyond what RLS allows the user.
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", orgId)
    .single();

  if (!org?.stripe_customer_id) {
    // This state means the user reached the portal button without having
    // completed a checkout. The UI should prevent this (portal button only
    // shows when subscription status is active/trialing), but we guard here anyway.
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
