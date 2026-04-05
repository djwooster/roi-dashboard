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
