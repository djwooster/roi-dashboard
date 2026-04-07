import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must call getUser() not getSession() to validate against Supabase server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Supabase sometimes ignores emailRedirectTo and lands the user on the Site
  // URL with the auth code as a query param. Catch it here and forward to the
  // proper callback route so the session gets established correctly.
  if (pathname === "/" && request.nextUrl.searchParams.get("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Public routes — no auth required
  if (pathname.startsWith("/demo") || pathname === "/") {
    // Authenticated users visiting root get sent straight to their dashboard
    if (user && pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Unauthenticated user trying to access protected routes
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated user — gate on onboarding completion
  if (user && pathname.startsWith("/dashboard")) {
    const onboardingDone = user.user_metadata?.onboarding_completed === true;
    if (!onboardingDone) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // Billing enforcement — redirect to /billing if subscription is inactive.
  // Enable by setting BILLING_ENFORCEMENT=true in env vars at launch.
  // /billing itself is always accessible so users can subscribe.
  //
  // Why we read from user_metadata instead of querying the DB:
  // The proxy runs on every request, so a DB query here would add a round-trip
  // to every page load for every user. Instead, we cache the subscription status
  // in the user's auth metadata (updated by the Stripe webhook handler whenever
  // the subscription changes). This trades up to ~1hr of staleness (JWT refresh
  // interval) for zero extra DB calls — acceptable for billing enforcement.
  if (
    process.env.BILLING_ENFORCEMENT === "true" &&
    user &&
    pathname.startsWith("/dashboard")
  ) {
    const status = user.user_metadata?.stripe_subscription_status;
    const active = status === "active" || status === "trialing";

    if (!active) {
      const url = request.nextUrl.clone();
      url.pathname = "/billing";
      return NextResponse.redirect(url);
    }
  }

  // Authenticated user who already finished onboarding hitting auth pages
  // Note: /forgot-password and /reset-password are intentionally excluded — always accessible
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const onboardingDone = user.user_metadata?.onboarding_completed === true;
    const url = request.nextUrl.clone();
    url.pathname = onboardingDone ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
