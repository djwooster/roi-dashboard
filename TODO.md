# SourceIQ — Implementation TODOs

## GHL Integration

### What's already built
- `/api/integrations/ghl/connect` — builds OAuth URL, sets CSRF nonce cookie
- `/api/integrations/crm/callback` — GHL alias route (GHL blocks "ghl" in redirect URIs)
- `lib/oauth-callback.ts` — shared OAuth callback logic used by all providers
- `lib/oauth-config.ts` — GHL entry with `tokenResponseIdField: "locationId"` (extracted from token response, no extra API call needed)
- `/api/ghl/sync` — fetches contact count, open opportunities, closed revenue
- `SourceTable` + `KPIBar` — GHL row wired with live data
- Disconnect button — red button on integrations page, sets status to `inactive`

### What still needs to be done (setup)
- [ ] Fully publish GHL app in marketplace.gohighlevel.com (add redirect URIs, scopes, hit Save/Publish)
- [ ] Add `GHL_CLIENT_ID` + `GHL_CLIENT_SECRET` to Vercel env vars (do locally too)
- [ ] Token refresh — GHL tokens expire; build `lib/ghl/getValidToken.ts` (same pattern as Meta token refresh below)

### GHL Insights — making the data valuable
Right now we show 3 numbers the user can already see in their GHL dashboard. The goal is to surface insights GHL doesn't show natively.

#### 1. Pipeline stage funnel (highest priority)
`PipelineFunnel.tsx` is already built with mock data + empty state — it just needs real data.
GHL API calls needed:
- `GET /pipelines/?locationId={id}` — fetch real pipeline stage names and IDs
- `GET /opportunities/search?location_id={id}&pipeline_stage_id={stageId}` — count + value per stage
- `GET /opportunities/search?location_id={id}&status=lost` — lost opps for Closed Lost bar

Real data is now wired: `/api/ghl/sync` returns `pipeline` (first pipeline only — see note below).
`PipelineFunnel.tsx` renders real stage names, counts, and conversion rates from live GHL data.

**Multi-pipeline per client (needs update):**
Agencies often run 1–3 separate pipelines per client, each representing a different offer (e.g. for a med spa: "1 Year Unlimited Laser Hair Removal" vs "3 Free Underarm Sessions"). Currently only the first pipeline is returned. 
- Update `/api/ghl/sync` to return `pipelines: GHLPipelineData[]` (all pipelines, not just `[0]`)
- Update `PipelineFunnel` to show a pipeline selector (tabs/dropdown) when multiple pipelines exist
- If only one pipeline, no selector shown — single funnel displayed as now
- In the agency multi-location view: show per-client, per-offer conversion rates so agencies can see which offer is performing best across all clients

Insights unlocked (things GHL doesn't surface automatically):
- Conversion rate between each stage (e.g. "42% of appointments become proposals")
- Where in the funnel leads are dropping off
- Which offer converts best for a given client

#### 2. Close rate + average deal value
Currently we fetch won opps but don't compute these. Add to `/api/ghl/sync`:
- `closeRate`: won / (won + lost) as a percentage
- `avgDealValue`: total won revenue / count of won opps

Show in KPIBar or a dedicated GHL insights card. GHL shows this buried in reports — we surface it prominently.

#### 3. Lead source breakdown
GHL contacts have a `source` field (Facebook, Google, referral, manual, etc.).
- `GET /contacts/?locationId={id}&limit=100` — fetch contacts with source field
- Group by source, count per source, show which sources generate the most contacts
- Eventually: cross-reference with Meta spend to show cost-per-GHL-contact by source

This becomes the most powerful cross-platform insight: "Your Facebook Ads generated 47 GHL contacts this month. 12 became opportunities. 4 closed for $18,000."

#### 4. New contacts this period (vs all time)
We currently show total contacts — a vanity number. More useful: new contacts in the last 30 days.
- `GET /contacts/?locationId={id}&startDate={30daysAgo}` — filter by date range
- Show "X new contacts (30d)" in SourceTable instead of all-time total

#### 5. Week-over-week / month-over-month trend data
Agencies report to clients monthly and need to show growth, not just snapshots. "47 new contacts this month (↑ 23% vs last month)" is far more compelling than a raw number.
- Requires background sync to be in place first (metrics stored with timestamps)
- Add trend indicators (delta + direction arrow) to KPIBar values
- Show sparkline charts on per-client drill-down views
- This is one of the most powerful things agencies can put in front of clients

#### 6. Agency multi-location view (high priority — primary audience)
Agencies managing 40+ GHL clients need a single dashboard to see all clients at a glance, with drill-down per client.
- Change GHL OAuth to request agency-level access (currently connects at location/sub-account level)
- After connect, call `GET /locations/?companyId={id}` to list all sub-accounts; store in `integrations.metadata` or a `ghl_locations` table
- UI: client overview table — one row per sub-account, showing pipeline value, close rate, new contacts
- Client drill-down: clicking a client loads the full funnel + KPI view scoped to that `locationId`
- This enables the **export feature**: per-client PDF/CSV report (agencies use this to report to their clients)
- Also enables "which funnel is performing best?" — compare close rate, appointment conversion, and pipeline velocity across all client locations
- Key agency insight: appointment conversion rate per client (leads → "Appointment Set" stage) — tells the agency where to keep spending and which clients need attention
- Spending guidance: cross-reference with lead source so agencies see "Facebook → 38 leads → 19 appts → 6 closed" per client

Implementation notes:
- All GHL API calls are already `locationId`-parameterized — multi-location is additive, not a rewrite
- Start with single-location funnel (current plan), then layer agency view on top
- Key metric for multi-location table: appointment conversion % (count at "Appointment Set"-equivalent stage / total leads) — derive from pipeline stages, no separate Calendar API needed if agencies use pipeline stages for appointments
- Export format: likely a printable/shareable summary card per client (name, key KPIs, funnel snapshot)

#### 7. Export feature (tied to agency multi-location view)
Agencies need to quickly generate client-facing reports. Not a spreadsheet dump — a clean summary they can send.
- Per-client report: logo, date range, KPI highlights, pipeline funnel snapshot
- Format options: PDF (print/email) or shareable link (public URL with read-only view)
- Trigger: "Export Report" button on each client's drill-down view

#### 8. Cross-platform attribution (longer term — requires both Meta + GHL connected)
The real differentiator. When a user has both Meta and GHL connected:
- GHL contacts with `source = "facebook"` or UTM params matching Meta campaigns
- Calculate: Meta spend → GHL contacts → GHL opportunities → closed revenue
- Show full funnel: "Facebook Ads: $2,400 spend → 38 GHL leads → 9 opps → 3 closed → $12,000 revenue"
- GHL doesn't show this. Meta doesn't show this. Only SourceIQ does.
- Implementation: match on UTM source/campaign fields stored on GHL contacts

---

## Meta Business Login OAuth Flow

### What's already in place
- `/api/integrations/facebook/connect` + `/api/integrations/facebook/callback`
- `integrations` table stores token, scoped to org
- `lib/oauth-config.ts` — scopes: `ads_read`, `ads_management`, `leads_retrieval` (`read_insights` removed — deprecated)
- App domain + redirect URI registered in Meta for Developers portal
- `/api/meta/insights` — fetches ad account spend, leads, revenue

### What still needs to be done

#### 0. Enter these URLs in Meta for Developers dashboard
- **Settings → Advanced → Data Deletion Requests**
  - Callback URL: `https://sourceiq.app/webhooks/meta/data-deletion`
  - Status URL: `https://sourceiq.app/webhooks/meta/data-deletion?id={confirmation_code}`

#### 1. Meta App Review — BLOCKER for real customers
Facebook app is unpublished — only the developer account can connect.
- Submit for App Review at developers.facebook.com (requires screencast demo)
- Request scopes: `ads_read`, `ads_management`, `leads_retrieval`
- Plan 1–5 business days

#### 2. Exchange for a long-lived token
The callback stores the short-lived token (~1 hr). After exchanging the code, make a second call:
```
GET https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={FACEBOOK_APP_ID}
  &client_secret={FACEBOOK_APP_SECRET}
  &fb_exchange_token={short_lived_token}
```
Store the long-lived token + `token_expires_at`.
File to update: `app/api/integrations/[provider]/callback/route.ts`

#### 3. Token refresh before API calls
Long-lived tokens expire after 60 days. Build `lib/meta/getValidToken.ts`:
check `token_expires_at`, re-exchange if within 7 days of expiry.
Call from `/api/meta/insights` before using the token.

#### 4. Account discovery after connect
After OAuth, call `/me/adaccounts` and store discovered account IDs in a `metadata` jsonb column on `integrations`. Removes the `FOUNDER_ACCOUNT_ID` / `FOUNDER_BUSINESS_ID` env var fallback.

---

## Code Quality / Technical Debt

Small items identified during architecture audit — none are blockers but worth cleaning up before scaling.

#### Billing page price hardcoded
`/billing/page.tsx` shows `$297 / month` as a string literal. If you change the price in Stripe, the page will show the wrong amount.
- Option A (simple): move price to an env var `NEXT_PUBLIC_PLAN_PRICE=297`
- Option B (proper): fetch the price from Stripe Products API at build time via `stripe.prices.retrieve(STRIPE_PRICE_ID)` and render it dynamically

#### Stripe `Invoice` type cast
`app/api/webhooks/stripe/route.ts` uses `Stripe.Invoice & { subscription?: string | null }` to work around a type mismatch introduced by the `2025-03-31.basil` API version renaming fields. Works correctly but is a smell.
- Revisit when Stripe SDK types stabilize for this API version
- Or pin to an earlier stable API version that has `invoice.subscription` typed correctly

#### `run npm run build` before every push
Several consecutive deploys failed due to TypeScript errors caught only at build time.
- Add a pre-push git hook or CI check: `npm run build` must pass before push

---

## Scale Roadmap

Priority order reflects what actually blocks revenue or customers.

### Before first paying customer

#### Stripe Billing — BUILT, needs env vars + Stripe dashboard setup
- [x] `stripe` package installed
- [x] `organizations` table: `stripe_customer_id`, `stripe_subscription_status`, `stripe_subscription_id`, `stripe_price_id`
- [x] `/api/stripe/checkout` — creates Checkout session, reuses existing customer
- [x] `/api/stripe/portal` — Customer Portal for managing billing from Settings
- [x] `/api/webhooks/stripe` — handles `checkout.session.completed`, `subscription.updated`, `subscription.deleted`, `invoice.payment_failed`
- [x] `/billing` — upgrade page with feature list + subscribe button
- [x] `proxy.ts` — enforcement logic ready, gated behind `BILLING_ENFORCEMENT=true`

**To activate billing:**
1. Create a product + price in Stripe dashboard (or use test mode first)
2. Add to Vercel env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Register webhook endpoint in Stripe dashboard: `https://sourceiq.app/api/webhooks/stripe`
   - Events to enable: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Set `BILLING_ENFORCEMENT=true` in Vercel env vars when ready to charge customers
5. Add "Manage billing" button to SettingsPage that POSTs to `/api/stripe/portal`

#### Forgot Password Page — BLOCKER
`/forgot-password` link exists in the login form but the page doesn't exist.
- Create `app/(auth)/forgot-password/page.tsx`
- Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`

#### Affiliate Program
Users get a unique referral link. If someone signs up via that link, the referrer earns 30% recurring commission on that user's subscription.
- Add `referral_code` (unique, auto-generated) and `referred_by` (org_id of referrer) columns to `organizations`
- Track referral at signup: read referral code from URL param, store `referred_by` on the new org
- Integrate with Stripe: when a referred user's subscription invoice is paid, trigger a 30% payout to the referrer
- Options for payout: Stripe Connect (recommended — automates payouts to referrer's bank) or manual payout tracking
- Referral dashboard: show referrer how many signups they've driven and total commission earned
- Landing page: shareable link format `https://sourceiq.app/?ref=THEIR_CODE`

---

### Before 50 customers

#### Background Data Sync — performance & rate limits
Every dashboard load currently hits Meta/GHL APIs directly. At 50 clients this will hit rate limits and be slow.
- Create a `metrics` table in Supabase to cache synced data per org per provider
- Set up a Vercel Cron job (or Supabase Edge Function) to sync all connected orgs hourly
- Dashboard reads from `metrics` table, not live API calls
- This also enables date range filtering (see below)

#### Error Monitoring (Sentry)
No visibility into production failures. ~5 minute setup.
- `npm install @sentry/nextjs` and run `npx @sentry/wizard`
- Set `SENTRY_DSN` in Vercel env vars

#### Fix Onboarding Race Condition
In `app/onboarding/page.tsx:68-89`, if the org insert succeeds but the member insert fails,
the user has an org with no membership and is permanently locked out.
- Wrap both inserts in a Supabase RPC function (database transaction) so they're atomic
- Replace the two separate `.insert()` calls with a single `supabase.rpc("create_org_with_owner", {...})`

---

### Before 100+ customers

#### Date Range Filtering
The picker was removed because it wasn't wired to live data. Once background sync stores
data in a `metrics` table with timestamps, this becomes straightforward.
- Re-add `DateRangePicker` to `dashboard/page.tsx`
- Pass selected range to KPIBar, SourceTable — they query `metrics` filtered by date

#### Plan Tier Enforcement
If multiple pricing tiers exist (e.g., 3 integrations vs. unlimited), enforce at the DB or middleware level.
- Add `plan` column to `organizations`
- Check plan limits in `proxy.ts` or API routes before allowing additional integrations

#### Team Invites UI
`invites` table exists in the DB schema but there's no UI to send or accept invitations.
- Build invite flow in SettingsPage
- Accept route: `app/api/invites/[token]/route.ts`

---

### Remaining Integrations

#### Google Ads
`lib/oauth-config.ts` already has Google configured.
- Register app in Google Cloud Console, get CLIENT_ID + CLIENT_SECRET
- Add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to Vercel env vars
- Build `/api/google/insights/route.ts`
- Wire Google row in SourceTable

#### HubSpot
- Register app at developers.hubspot.com
- Build `/api/hubspot/sync/route.ts`
- Wire HubSpot row in SourceTable

#### Salesforce
- Register connected app in Salesforce Setup
- Build `/api/salesforce/sync/route.ts`
- Wire Salesforce row in SourceTable

#### Jobber
- Register app at developer.getjobber.com
- Build `/api/jobber/sync/route.ts`
- Wire Jobber row in SourceTable
