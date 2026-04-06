# SourceIQ — Implementation TODOs

## Meta Business Login OAuth Flow

**Goal:** When a client clicks "Connect Facebook Ads," take them through Meta's Business Login
OAuth flow, exchange the code for a long-lived token, and persist it scoped to their org.

### What's already in place
- `/api/integrations/facebook/connect` — builds the OAuth redirect URL, sets a CSRF nonce cookie
- `/api/integrations/facebook/callback` — verifies nonce, exchanges code for tokens, upserts to `integrations` table
- `integrations` table — `org_id`, `provider`, `access_token`, `refresh_token`, `token_expires_at`, `status`, RLS via `get_my_org_id()`
- `lib/oauth-config.ts` — Facebook entry: auth URL, token URL, scopes (`ads_read`, `ads_management`)
- `components/IntegrationsPage.tsx` — Connect button links to `/api/integrations/facebook/connect`

### What still needs to be done

#### 0. Enter these URLs in Meta for Developers dashboard
- **Settings → Advanced → Data Deletion Requests**
  - Callback URL: `https://sourceiq.app/webhooks/meta/data-deletion`
  - Status URL: `https://sourceiq.app/webhooks/meta/data-deletion?id={confirmation_code}` (Meta fills in the code)
- **Settings → Advanced → Deauthorize Callback URL** (optional but recommended)
  - `https://sourceiq.app/webhooks/meta/data-deletion` (same endpoint handles both)

#### 1. Register the Facebook App & set env vars
- Create an app at developers.facebook.com → add **Marketing API** product
- Set OAuth redirect URI: `https://sourceiq.app/api/integrations/facebook/callback`
- Add to Vercel env vars:
  ```
  FACEBOOK_APP_ID=...
  FACEBOOK_APP_SECRET=...
  ```
- Submit for **App Review** to unlock `ads_read` / `read_insights` for non-test users
  (requires a screencast demo — plan ~1–5 business days)

#### 2. Request the right scopes
Update `lib/oauth-config.ts` facebook scopes to include `read_insights`:
```ts
scopes: ["ads_read", "ads_management", "read_insights", "leads_retrieval"],
```

#### 3. Exchange for a long-lived token
The callback currently stores the short-lived token (~1 hr) returned from the code exchange.
After exchanging the code, make a second call to get a long-lived token (60 days):
```
GET https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={FACEBOOK_APP_ID}
  &client_secret={FACEBOOK_APP_SECRET}
  &fb_exchange_token={short_lived_token}
```
Store the long-lived token + `token_expires_at` in the `integrations` row.
File to update: `app/api/integrations/[provider]/callback/route.ts`

#### 4. Token refresh before API calls
Long-lived tokens expire after 60 days. Before calling the Meta API, check `token_expires_at`.
If within 7 days of expiry, re-exchange using the same `fb_exchange_token` grant.
A good place to put this: a `lib/meta/getValidToken.ts` helper called by `/api/meta/insights`.

#### 5. Account discovery after connect
After a successful OAuth, call `/me/adaccounts` with the new token and store the
discovered account IDs in the `integrations` row (e.g., a `metadata` jsonb column).
This removes the need for the `FOUNDER_ACCOUNT_ID` / `FOUNDER_BUSINESS_ID` env var fallback
in `app/api/meta/insights/route.ts`.

#### 6. Scope the insights route to the connected token
`/api/meta/insights` already fetches the token from `integrations` by `org_id` — this is correct.
Once the OAuth flow is live, remove the founder-specific fallback constants and rely solely
on the discovered account IDs stored in step 5.

---

## Scale Roadmap

Priority order reflects what actually blocks revenue or customers.

### Before first paying customer

#### Stripe Billing — BLOCKER
No subscription system exists. Without it you cannot charge anyone.
- Add Stripe, create products/prices for each plan tier
- Webhook route: `app/api/webhooks/stripe/route.ts` — update `organizations.stripe_subscription_status`
- Enforce in `proxy.ts`: redirect to `/billing` if subscription is inactive
- Stub in AGENTS.md once pattern is established:
  ```
  organizations.stripe_subscription_status — checked in proxy.ts before serving /dashboard
  ```

#### Forgot Password Page — BLOCKER
`/forgot-password` link exists in the login form but the page doesn't exist.
- Create `app/(auth)/forgot-password/page.tsx`
- Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`

#### Meta App Review — BLOCKER for real customers
Facebook app is in dev mode — only test users can connect Meta Ads.
- Submit for App Review at developers.facebook.com (requires screencast demo)
- Request scopes: `ads_read`, `ads_management`, `read_insights`, `leads_retrieval`
- Also enter webhook URLs per TODO items above (data deletion, deauthorize callback)
- Plan 1–5 business days — start this in parallel with other dev work

#### Meta Token Refresh — required before go-live
Short-lived tokens (~1 hr) get stored today. First customers will silently lose their Meta integration within hours.
- Build `lib/meta/getValidToken.ts`: check `token_expires_at`, re-exchange if within 7 days of expiry
- Call from `/api/meta/insights` before using the token
- Details in Meta OAuth section above (step 3 & 4)

---

### Before 50 customers

#### Background Data Sync — performance & rate limits
Every dashboard load currently hits Meta's API directly. At 50 clients this will hit rate limits and be slow.
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
Agency/consultant clients will ask for this early — it's a key use case per onboarding role options.
- Build invite flow in SettingsPage
- Accept route: `app/api/invites/[token]/route.ts`

---

### GHL Integration (next up)

`lib/oauth-config.ts` already has GHL configured.

- [ ] Register app at marketplace.gohighlevel.com, get CLIENT_ID + CLIENT_SECRET
- [ ] Add `GHL_CLIENT_ID` / `GHL_CLIENT_SECRET` to Vercel env vars
- [ ] Build `/api/ghl/sync/route.ts` — fetch contacts/pipeline data, return in consistent shape
- [ ] Wire GHL row in `EmptySourceTable` to show real data (same pattern as Meta row)
- [ ] Test connect → callback → insights flow end to end
