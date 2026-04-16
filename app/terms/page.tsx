export const metadata = {
  title: "Terms of Service — SourceIQ",
  description: "Terms governing your use of SourceIQ.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-[#a3a3a3] mb-10">Last updated April 15, 2026</p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Agreement
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          By creating an account or using SourceIQ (&quot;the Service&quot;), you agree
          to these Terms of Service (&quot;Terms&quot;). If you are using SourceIQ on
          behalf of a company or organization, you represent that you have
          authority to bind that entity to these Terms. If you do not agree,
          do not use the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          What SourceIQ is
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          SourceIQ is a marketing performance dashboard that connects to
          third-party platforms — including Meta (Facebook Ads) and
          GoHighLevel — to aggregate ad spend, lead generation, and CRM pipeline
          data in one place. We display this data to you; we do not manage your
          campaigns or make spending decisions on your behalf.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Accounts
        </h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-[#525252]">
          <li>
            You must be at least 18 years old and legally capable of entering a
            contract to create an account.
          </li>
          <li>
            You are responsible for maintaining the confidentiality of your
            login credentials and for all activity that occurs under your
            account.
          </li>
          <li>
            You must provide accurate information during signup and keep it
            up to date.
          </li>
          <li>
            You may not share your account with others or create accounts on
            behalf of third parties without their authorization.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Acceptable use
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed mb-3">
          You agree not to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-[#525252]">
          <li>
            Use the Service to access third-party accounts or data you are not
            authorized to access.
          </li>
          <li>
            Attempt to reverse-engineer, decompile, or extract the source code
            of SourceIQ.
          </li>
          <li>
            Use the Service in a way that violates the terms of any connected
            third-party platform (e.g., Meta Platform Policy, GoHighLevel ToS).
          </li>
          <li>
            Resell, sublicense, or redistribute the Service without our written
            permission.
          </li>
          <li>
            Introduce malicious code, overload our infrastructure, or attempt
            unauthorized access to our systems.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Third-party integrations
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          SourceIQ connects to third-party services (Meta, GoHighLevel, Stripe,
          and others) via OAuth. By connecting an integration, you authorize us
          to access data from that platform on your behalf using the permissions
          you grant. We are not responsible for the availability, accuracy, or
          policies of third-party platforms. If a third-party API changes or
          becomes unavailable, some features may stop working temporarily or
          permanently.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Subscription and billing
        </h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-[#525252]">
          <li>
            Some features require a paid subscription. Current pricing is shown
            at{" "}
            <a
              href="/billing"
              className="text-[#0a0a0a] underline underline-offset-2"
            >
              sourceiq.app/billing
            </a>
            .
          </li>
          <li>
            Subscriptions renew automatically at the end of each billing period
            unless you cancel before the renewal date.
          </li>
          <li>
            You can manage or cancel your subscription at any time from
            Settings → Billing. Cancellation takes effect at the end of the
            current billing period — no partial refunds.
          </li>
          <li>
            We reserve the right to change pricing with 30 days&apos; notice to
            active subscribers.
          </li>
          <li>
            Payments are processed by Stripe. We do not store your payment card
            details.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Your data
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          You retain ownership of all data you bring into SourceIQ (ad account
          data, CRM data, etc.). By using the Service, you grant us a limited
          license to process that data solely for the purpose of providing the
          Service to you. We do not sell your data or use it to train AI models.
          See our{" "}
          <a
            href="/privacy"
            className="text-[#0a0a0a] underline underline-offset-2"
          >
            Privacy Policy
          </a>{" "}
          for full details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Intellectual property
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          SourceIQ, its logo, design, and underlying software are the property
          of D. Wooster / SourceIQ and are protected by applicable intellectual
          property laws. Nothing in these Terms grants you a right to use our
          trademarks or branding. We grant you a limited, non-exclusive,
          non-transferable license to use the Service for its intended purpose
          during your subscription.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Disclaimer of warranties
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND.
          WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
          OR THAT THE DATA DISPLAYED IS ALWAYS ACCURATE OR UP TO DATE. AD
          PERFORMANCE METRICS ARE SOURCED FROM THIRD-PARTY APIS AND MAY REFLECT
          DELAYS OR DISCREPANCIES. YOUR USE OF THE SERVICE IS AT YOUR OWN RISK.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Limitation of liability
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOURCEIQ AND ITS OPERATORS
          SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOST PROFITS, LOST
          DATA, OR BUSINESS INTERRUPTION — ARISING FROM YOUR USE OF OR INABILITY
          TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
          DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM WILL NOT EXCEED THE
          AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Termination
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          You may terminate your account at any time from Settings → Account →
          Delete Account. We may suspend or terminate your account if you
          violate these Terms, with or without prior notice. Upon termination,
          your right to use the Service ends immediately and your data will be
          deleted in accordance with our Privacy Policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Governing law
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          These Terms are governed by the laws of the United States. Any
          disputes will be resolved through binding arbitration under the rules
          of the American Arbitration Association, except that either party may
          seek injunctive relief in a court of competent jurisdiction.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Changes to these terms
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          We may update these Terms from time to time. When we do, we will
          update the &quot;Last updated&quot; date at the top. Continued use of the
          Service after changes are posted constitutes your acceptance of the
          revised Terms. Material changes will be communicated by email to
          active account holders at least 14 days in advance.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Contact
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          Questions about these Terms? Email us at:
        </p>
        <a
          href="mailto:hello@sourceiq.app"
          className="inline-block mt-2 text-sm font-medium text-[#0a0a0a] underline underline-offset-2"
        >
          hello@sourceiq.app
        </a>
      </section>
    </div>
  );
}
