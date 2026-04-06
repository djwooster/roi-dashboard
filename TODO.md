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

### What still needs to be done
- [ ] Fully publish GHL app in marketplace.gohighlevel.com (add redirect URIs, scopes, hit Save/Publish)
- [ ] Add `GHL_CLIENT_ID` + `GHL_CLIENT_SECRET` to Vercel env vars (do locally too)
- [ ] Token refresh — GHL tokens expire; build `lib/ghl/getValidToken.ts` (same pattern as Meta token refresh below)

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

## Scale Roadmap

Priority order reflects what actually blocks revenue or customers.

### Before first paying customer

#### Stripe Billing — BLOCKER
No subscription system exists. Without it you cannot charge anyone.
- Add Stripe, create products/prices for each plan tier
- Webhook route: `app/api/webhooks/stripe/route.ts` — update `organizations.stripe_subscription_status`
- Enforce in `proxy.ts`: redirect to `/billing` if subscription is inactive

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
