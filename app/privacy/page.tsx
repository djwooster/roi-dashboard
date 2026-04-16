export const metadata = {
  title: "Privacy Policy — SourceIQ",
  description: "How SourceIQ collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-[#a3a3a3] mb-10">Last updated April 15, 2026</p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Who we are
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          SourceIQ (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a
          marketing performance dashboard operated by D. Wooster at
          sourceiq.app. This policy explains what information we collect when
          you use SourceIQ, how we use it, and your rights regarding that
          information. If you have questions, email us at{" "}
          <a
            href="mailto:privacy@sourceiq.app"
            className="text-[#0a0a0a] underline underline-offset-2"
          >
            privacy@sourceiq.app
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Information we collect
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed mb-3">
          We collect the following categories of information:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-[#525252]">
          <li>
            <strong>Account information</strong> — your email address and
            password (hashed, never stored in plain text) when you create a
            SourceIQ account.
          </li>
          <li>
            <strong>Organization information</strong> — your company name and
            any details you enter during onboarding.
          </li>
          <li>
            <strong>OAuth tokens</strong> — when you connect a third-party
            platform (Meta, GoHighLevel, etc.), we store an OAuth access token
            and refresh token so we can fetch data on your behalf. We also store
            your user ID on that platform (&quot;provider user ID&quot;) for
            identity purposes and compliance.
          </li>
          <li>
            <strong>Ad performance data</strong> — when you connect a Meta Ads
            account, we retrieve ad spend, impressions, clicks, leads, and
            purchase revenue via the Meta Marketing API. This data is displayed
            in your dashboard and is not stored persistently beyond our
            short-lived server cache.
          </li>
          <li>
            <strong>CRM data</strong> — when you connect GoHighLevel, we
            retrieve contact counts, opportunity pipeline data, and calendar
            appointments for locations you authorize. This data is cached for up
            to 2 hours and stored as aggregate KPI snapshots in our database.
          </li>
          <li>
            <strong>Billing information</strong> — we use Stripe to process
            payments. We store your Stripe customer ID and subscription status.
            We never see or store your full card number.
          </li>
          <li>
            <strong>Usage data</strong> — standard server logs including IP
            addresses, browser type, and pages visited. These are used for
            debugging and security, not sold or shared.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          How we use your information
        </h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-[#525252]">
          <li>To authenticate you and secure your account.</li>
          <li>
            To fetch and display marketing performance data from connected
            third-party platforms in your SourceIQ dashboard.
          </li>
          <li>
            To generate shareable client reports on your behalf.
          </li>
          <li>To process subscription payments via Stripe.</li>
          <li>
            To send transactional emails (password reset, email confirmation).
            We do not send marketing emails without your explicit consent.
          </li>
          <li>
            To comply with legal obligations, including responding to verified
            data deletion requests.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          How we share your information
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed mb-3">
          We do not sell your personal information. We share data only as
          follows:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-[#525252]">
          <li>
            <strong>Supabase</strong> — our database and authentication
            provider. Your account data and OAuth tokens are stored in Supabase
            (hosted on AWS). Data is encrypted at rest and in transit.
          </li>
          <li>
            <strong>Stripe</strong> — payment processor. We share your email
            address with Stripe when you subscribe. Stripe&apos;s privacy policy
            governs their use of your data.
          </li>
          <li>
            <strong>Vercel</strong> — our hosting provider. Vercel processes
            incoming requests and may log standard HTTP metadata.
          </li>
          <li>
            <strong>Meta (Facebook)</strong> — we make API calls to Meta on
            your behalf using your OAuth token. We do not share your SourceIQ
            data back to Meta.
          </li>
          <li>
            <strong>Legal requirements</strong> — we may disclose information
            if required by law, subpoena, or to protect our legal rights.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Cookies and session storage
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          We use cookies strictly for functionality — not for advertising or
          cross-site tracking. Specifically:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-[#525252] mt-3">
          <li>
            <strong>Session cookies</strong> — Supabase sets a cookie to keep
            you logged in across page loads. This cookie is HttpOnly and is
            cleared when you log out.
          </li>
          <li>
            <strong>OAuth nonce cookie</strong> — when you initiate a
            third-party connection (e.g., Connect Facebook), we set a short-lived
            (10-minute) HttpOnly cookie containing a CSRF nonce. It is deleted
            after the OAuth callback completes.
          </li>
        </ul>
        <p className="text-sm text-[#525252] leading-relaxed mt-3">
          We do not use third-party advertising cookies, tracking pixels, or
          analytics services that share your data externally.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Data retention
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          We retain your account data for as long as your account is active.
          OAuth tokens are stored until you disconnect the integration or delete
          your account. Aggregate KPI snapshots (from the cron sync) are
          retained indefinitely to support historical reporting — these contain
          no personal information. If you delete your account, all associated
          data is permanently removed within 30 days.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Your rights
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed mb-3">
          Depending on your location, you may have rights to access, correct,
          export, or delete your personal data. To exercise any of these rights:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-[#525252]">
          <li>
            <strong>Delete your account</strong> — from within SourceIQ under
            Settings → Account → Delete Account.
          </li>
          <li>
            <strong>Delete your Facebook data</strong> — see our{" "}
            <a
              href="/privacy/data-deletion"
              className="text-[#0a0a0a] underline underline-offset-2"
            >
              Data Deletion page
            </a>
            .
          </li>
          <li>
            <strong>Any other request</strong> — email{" "}
            <a
              href="mailto:privacy@sourceiq.app"
              className="text-[#0a0a0a] underline underline-offset-2"
            >
              privacy@sourceiq.app
            </a>{" "}
            and we will respond within 30 days.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Security
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          We use industry-standard security measures: TLS encryption in transit,
          encryption at rest via Supabase, row-level security policies so users
          can only access their own organization&apos;s data, and HttpOnly cookies
          to prevent token theft via XSS. OAuth tokens are stored server-side
          and never exposed to the browser. Webhook signatures (e.g., from Meta
          and Stripe) are verified before processing.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Children&apos;s privacy
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          SourceIQ is a business tool intended for adults. We do not knowingly
          collect personal information from anyone under 18. If you believe a
          minor has created an account, contact us and we will delete it.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Changes to this policy
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          We may update this policy from time to time. When we do, we will
          update the &quot;Last updated&quot; date at the top. Material changes will be
          communicated by email to active account holders.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Contact
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          Questions or concerns about this policy? Reach us at:
        </p>
        <a
          href="mailto:privacy@sourceiq.app"
          className="inline-block mt-2 text-sm font-medium text-[#0a0a0a] underline underline-offset-2"
        >
          privacy@sourceiq.app
        </a>
      </section>
    </div>
  );
}
