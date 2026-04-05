export const metadata = {
  title: "Data Deletion — SourceIQ",
  description: "How to request deletion of your data from SourceIQ.",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-2">
        Data Deletion Request
      </h1>
      <p className="text-sm text-[#a3a3a3] mb-10">
        Last updated April 5, 2026
      </p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          What data we store
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          When you connect a Facebook Ads account to SourceIQ, we store your
          OAuth access token and your Facebook user ID so we can fetch your ad
          performance data on your behalf. We do not store your name, email, or
          any personal profile information from Facebook.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Option 1 — Disconnect via Facebook Settings
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed mb-3">
          You can revoke SourceIQ&apos;s access to your Facebook data at any
          time directly from your Facebook account:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-[#525252]">
          <li>
            Go to{" "}
            <a
              href="https://www.facebook.com/settings/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0a0a0a] underline underline-offset-2"
            >
              facebook.com/settings/apps
            </a>
          </li>
          <li>Find <strong>SourceIQ</strong> in the list of connected apps</li>
          <li>Click <strong>Remove</strong></li>
        </ol>
        <p className="text-sm text-[#a3a3a3] mt-3">
          Removing the app triggers an automatic deletion of your stored access
          token and Facebook user ID from our systems.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          Option 2 — Contact us directly
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          You can also email us and we will manually delete all data associated
          with your account within 30 days:
        </p>
        <a
          href="mailto:privacy@sourceiq.app"
          className="inline-block mt-2 text-sm font-medium text-[#0a0a0a] underline underline-offset-2"
        >
          privacy@sourceiq.app
        </a>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#0a0a0a] uppercase tracking-wider mb-3">
          What gets deleted
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-[#525252]">
          <li>Your Facebook OAuth access token</li>
          <li>Your Facebook user ID</li>
          <li>Any cached ad account identifiers associated with your connection</li>
        </ul>
        <p className="text-sm text-[#a3a3a3] mt-4">
          We do not sell your data or share it with third parties outside of the
          Meta API calls required to power your dashboard.
        </p>
      </section>
    </div>
  );
}
