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

### 1. GHL Agency OAuth (highest priority — primary audience unlock)
Currently connects at location level (single sub-account). Agencies need company-level access.

**What changes:**
- Update `lib/oauth-config.ts` GHL scopes to request company-level / agency access
- After connect, call `GET /locations/?companyId={id}` to list all sub-accounts
- Store sub-accounts in a new `ghl_locations` table: `org_id`, `location_id`, `location_name`, `company_id`
- `getValidGHLToken` will need to work per-location (each location may have its own token under agency OAuth)

**Why this matters:** Without this, an agency with 40 clients must connect each one individually — not viable.

### 2. Client Switcher (depends on #1)
Vercel-style searchable dropdown in the dashboard header to switch between client locations.

**Pattern:** `[Client Name ▾]` → dropdown opens, search auto-focuses, scrollable list, active item highlighted.

**Implementation:**
- New `ClientSwitcher.tsx` component in dashboard header
- Reads from `ghl_locations` table (populated after agency OAuth)
- `currentLocationId` state in dashboard; passed to KPIBar, SourceTable, PipelineFunnel, ExportMenu
- Each data fetch parameterised by `locationId` instead of always reading from `integrations.provider_user_id`
- If only one location: show location name as plain text (no dropdown)

### 3. Report page: per-client URL (depends on #1)
Currently one report per org. After agency OAuth, one report per location.

- `reports` table already has `location_id` — just needs to support one row per location (change unique constraint from `org_id` to `org_id, location_id`)
- "Share Report" button scoped to the currently selected client in the switcher

### 4. Background Sync (unlocks date range + trends)
Every dashboard/report load currently hits GHL live. At scale this hits rate limits.

- New `metrics` table: `org_id`, `location_id`, `provider`, `period_start`, `period_end`, `data` (jsonb)
- Vercel Cron job (`/api/cron/sync`) — runs hourly, syncs all active integrations, writes to `metrics`
- Dashboard and report page read from `metrics` instead of live API calls
- Enables: date range picker, week-over-week trend arrows, historical sparklines

### 5. AI Summary on Report Page (Anthropic API)
Architecture is scaffolded — `AISummaryPlaceholder` is in place.

- Add `ANTHROPIC_API_KEY` to Vercel env vars
- Create `lib/ai/generateReportSummary.ts` — takes `GHLSyncResponse`, returns 3–4 sentence plain-English summary
- Use `claude-haiku-4-5` for speed/cost (summary task, not analysis)
- Cache the summary in the `reports` table (`ai_summary text`, `summary_generated_at timestamptz`)
- Regenerate if summary is older than 24hrs or data has materially changed

### 6. Date Range Picker (depends on #4)
Removed earlier because the picker wasn't wired to real data.

- Re-add `DateRangePicker` to `dashboard/page.tsx`
- Pass selected range to `fetchLocationData` (or query `metrics` table by date range)
- Report page: allow date range in the URL (`/report/[token]?from=2026-03-01&to=2026-03-31`)

### 7. Week-over-Week Trend Data (depends on #4)
Agencies report to clients monthly and need to show growth, not just snapshots.

- Add delta + direction arrow to KPIBar values: "84 contacts ↑ 23% vs last month"
- Sparkline charts on the report page per-client drill-down
- Computed from `metrics` table: compare current period vs prior period

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
