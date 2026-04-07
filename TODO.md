# SourceIQ — Implementation TODOs

---

## What's Built (complete)

- **GHL OAuth** — connect, callback (`/crm/callback` alias — GHL blocks "ghl" in redirect URIs), disconnect
- **GHL sync** — contacts, open opps, closed revenue, per-pipeline won/lost/revenue, close rate, avg deal value
- **GHL token refresh** — `lib/ghl/getValidToken.ts` proactively refreshes before expiry, marks integration inactive on failure
- **GHL pipeline funnel** — `PipelineFunnel.tsx` with real stage data, multi-pipeline tab selector
- **Meta OAuth** — connect, callback, disconnect (short-lived token stored — long-lived exchange still needed)
- **Meta insights** — ad spend, leads, revenue via `/api/meta/insights`
- **Stripe billing** — checkout, customer portal, webhook (all 4 lifecycle events), billing page, settings tab
- **Stripe reliability** — customer ID validated before reuse (handles test→live mode switch), DB failures return 500 for retry
- **Onboarding** — `create_org_with_owner` RPC wraps org + member + profile in a single transaction (no more race condition)
- **Auth** — login, signup, forgot password, reset password, PKCE callback
- **Shareable report page** — `/report/[token]`, public, live GHL data, mobile-first, agency + client name, funnel leaderboard, AI summary placeholder
- **Shared GHL utilities** — `lib/ghl/types.ts`, `lib/ghl/api.ts`, `lib/ghl/fetchLocationData.ts` (used by both sync route and report page)
- **Demo mode** — `/demo` always works as marketing tool, mock data paths preserved in all components
- **Billing enforcement** — `proxy.ts` reads subscription status from JWT metadata (no DB round-trip per request)
- **Code comments** — all new files commented with why-not-what for contract developers

---

## Active / Next Up

### 1. ✅ GHL Agency OAuth
Company-level scopes, `ghl_locations` table, `lib/ghl/syncLocations.ts`. Token response `companyId` stored as `provider_user_id`; locations synced after connect. Single-location accounts unaffected (backward compatible).

### 2. ✅ Client Switcher
`ClientSwitcher.tsx` — searchable dropdown in dashboard header, reads `ghl_locations`, hidden when < 2 locations.

### 3. ✅ Date Range Picker (partial)
`DateRangePicker.tsx` — preset selector wired to `/api/ghl/sync?from=&to=`. Filters live GHL opportunity data. Full historical filtering requires background sync (#4).

### 4. Report page: per-client URL (depends on #1)
Change `reports` unique constraint from `org_id` to `(org_id, location_id)`. Wire "Share Link" button to current location in switcher.

### 5. ✅ Background Sync
`metrics` table (Supabase), Vercel Cron at `/api/cron/sync` (hourly), dashboard passes `?period=` to `/api/ghl/sync` which serves from cache (< 2h) before falling back to live GHL. Pre-syncs all 5 preset windows (all_time / today / 7d / 30d / 90d) per location per org. Add `CRON_SECRET` env var in Vercel.

### 6. ✅ AI Summary on Report Page
`lib/ai/generateReportSummary.ts` — `claude-haiku-4-5`, structured JSON output (up to 5 `{ heading, body }` sections). Cached in `reports.ai_summary` (24h TTL). Gracefully falls back to placeholder if `ANTHROPIC_API_KEY` is absent or generation fails.

### 7. Week-over-Week Trend Data (depends on #5)
- Delta + direction arrow on KPIBar values: "84 contacts ↑ 23% vs last month"
- Computed from `metrics` table: current period vs prior period

---

## Before First Paying Customer

### GHL App Published
- Fully publish in marketplace.gohighlevel.com — add redirect URIs, scopes, hit Save/Publish
- Add `GHL_CLIENT_ID` + `GHL_CLIENT_SECRET` to Vercel env vars

### Meta App Review — BLOCKER for real Meta customers
- Submit at developers.facebook.com (requires screencast demo)
- Request scopes: `ads_read`, `ads_management`, `leads_retrieval`
- Plan 1–5 business days

### Meta Long-Lived Token Exchange
The callback stores a short-lived token (~1hr). Exchange it for a 60-day token after OAuth:
```
GET https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={FACEBOOK_APP_ID}
  &client_secret={FACEBOOK_APP_SECRET}
  &fb_exchange_token={short_lived_token}
```
Build `lib/meta/getValidToken.ts` (same pattern as `lib/ghl/getValidToken.ts`).
File to update: `app/api/integrations/[provider]/callback/route.ts`

### Forgot Password Page ✓ (built)
### Stripe Activate
1. Create product + price in Stripe dashboard
2. Add env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Register webhook at `https://sourceiq.app/api/webhooks/stripe`
4. Set `BILLING_ENFORCEMENT=true` when ready to charge

### Meta Data Deletion Webhook
- Settings → Advanced → Data Deletion Requests in Meta Developer portal
- Callback URL: `https://sourceiq.app/webhooks/meta/data-deletion`

---

## Technical Debt (non-blocking)

### Billing page price hardcoded
`/billing/page.tsx` shows `$297 / month` as a string literal.
- Option A: `NEXT_PUBLIC_PLAN_PRICE=297` env var
- Option B: fetch from `stripe.prices.retrieve(STRIPE_PRICE_ID)` at build time

### Stripe `Invoice` type cast
`app/api/webhooks/stripe/route.ts` uses `Stripe.Invoice & { subscription?: string | null }` due to an SDK type mismatch in API version `2025-03-31.basil`. Revisit when SDK types stabilise.

### Pre-push build check
Several consecutive deploys failed due to TypeScript errors caught only at build time.
Add a pre-push git hook: `npm run build` must pass before push.

---

## Scale Roadmap

### Before 50 customers
- **Sentry** — `npm install @sentry/nextjs`, run `npx @sentry/wizard`, set `SENTRY_DSN`
- **Background sync** (see #4 above) — also unblocks date range + trends
- **Error monitoring** — no visibility into production failures without Sentry

### Before 100+ customers
- **Plan tier enforcement** — `plan` column on `organizations`, check limits in `proxy.ts`
- **Team Invites UI** — `invites` table exists, no UI yet. Build invite flow in SettingsPage + `app/api/invites/[token]/route.ts`

---

## Remaining Integrations

### Google Ads
`lib/oauth-config.ts` already configured.
- Register in Google Cloud Console, get CLIENT_ID + CLIENT_SECRET
- Build `/api/google/insights/route.ts`
- Wire Google row in SourceTable

### HubSpot
- Register at developers.hubspot.com
- Build `/api/hubspot/sync/route.ts`

### Salesforce
- Register connected app in Salesforce Setup
- Build `/api/salesforce/sync/route.ts`

### Jobber
- Register at developer.getjobber.com
- Build `/api/jobber/sync/route.ts`

---

## Longer-Term Vision

### Affiliate Program
- `referral_code` (unique, auto-generated) + `referred_by` (org_id) on `organizations`
- Track at signup via URL param
- Stripe Connect for 30% recurring commission payouts
- Referral dashboard: signups driven + commission earned

### Cross-Platform Attribution (requires Meta + GHL both connected)
The primary differentiator. GHL contacts with `source = "facebook"` matched to Meta campaigns.
- Show: "Facebook Ads: $2,400 spend → 38 GHL leads → 9 opps → 3 closed → $12,000 revenue"
- Match on UTM source/campaign fields stored on GHL contacts
- Neither GHL nor Meta shows this. Only SourceIQ does.

### Export Feature (tied to agency multi-location)
Per-client PDF or shareable summary card for agency client reporting.
- Trigger: "Export Report" button on client drill-down
- Format: clean summary (logo, date range, KPI highlights, funnel snapshot)
- The shareable link (`/report/[token]`) is already built — PDF is the next step
