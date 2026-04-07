# SourceIQ — Codebase Map

Quick reference for navigating the codebase. Check here before reading files or creating new ones.
Keep this updated when adding routes, components, or lib files.

---

## API Routes

| Route | Method | Auth | What it does |
|---|---|---|---|
| `/api/ghl/sync` | GET | user session | Returns KPIs + pipeline data. Params: `?locationId=`, `?period=` (cache key: all_time/today/7d/30d/90d), `?from=` / `?to=`. Checks `metrics` cache (< 2h) before live GHL call. |
| `/api/cron/sync` | GET | `CRON_SECRET` | Vercel Cron (hourly). Loops all active GHL orgs × locations × 5 period windows. Upserts to `metrics` table. |
| `/api/meta/insights` | GET | user session | Returns Meta ad spend, leads, revenue from the connected ad account. |
| `/api/reports/create` | POST | user session | Creates (or retrieves existing) shareable report token for the org's GHL location. |
| `/api/integrations/[provider]/connect` | GET | user session | Builds OAuth URL, sets CSRF nonce cookie. Provider config from `lib/oauth-config.ts`. |
| `/api/integrations/[provider]/callback` | GET | none | Exchanges OAuth code for tokens, upserts to `integrations` table. Logic in `lib/oauth-callback.ts`. |
| `/api/integrations/crm/callback` | GET | none | GHL-specific alias — GHL blocks redirect URIs containing the string "ghl". |
| `/api/integrations/[provider]/disconnect` | POST | user session | Sets integration status to `inactive`. |
| `/api/stripe/checkout` | POST | user session | Creates Stripe Checkout session. Validates stored customer ID before reuse. |
| `/api/stripe/portal` | POST | user session | Creates Stripe Customer Portal session for billing self-service. |
| `/api/webhooks/stripe` | POST | Stripe sig | Handles `checkout.session.completed`, `subscription.updated`, `subscription.deleted`, `invoice.payment_failed`. Updates org + user metadata. |
| `/api/invites` | — | — | Stub — invite flow not yet built. |

---

## Pages

| Path | Auth required | What it does |
|---|---|---|
| `/` | none | Landing page (marketing). Authenticated users redirect to `/dashboard`. |
| `/demo` | none | Marketing demo — Dashboard wrapped in `DemoContext.Provider`. Always uses mock data. |
| `/dashboard` | user + onboarding | Main app. Loads `ghl_locations` on mount, resolves active location, fetches GHL + Meta. Header has ClientSwitcher + DateRangePicker. |
| `/onboarding` | user | Org setup form. Calls `create_org_with_owner` RPC (atomic — org + member + profile in one transaction). |
| `/report/[token]` | none (token = auth) | Public client report. Fetches live GHL data + AI summary (cached 24h in `reports.ai_summary`). Mobile-first. |
| `/billing` | user | Upgrade page. Posts to `/api/stripe/checkout`. Shows current subscription status. |
| `/login` | none | Email + password login. Hard-navigates to `/dashboard` on success. |
| `/signup` | none | Email + password signup. Hard-navigates to `/onboarding` on success. |
| `/forgot-password` | none | Sends Supabase reset email with redirect to `/reset-password`. |
| `/reset-password` | none | New password form. Calls `supabase.auth.updateUser`. |
| `/auth/callback` | none | PKCE callback. Exchanges code for session. Redirects to `/reset-password` if `type=recovery`, else `/onboarding`. |
| `/privacy/data-deletion` | none | Compliance page — must remain public. |
| `/webhooks/meta/data-deletion` | none | Meta data deletion webhook — must remain public. |
| `/invite/[token]` | none | Invite acceptance — DB table exists, UI not yet built. |
| `/confirm-email` | none | Post-signup confirmation landing page. |

---

## Lib Files

| File | What it does |
|---|---|
| `lib/ghl/types.ts` | **Single source of truth for all GHL types.** `GHLPipelineData`, `GHLSyncResponse`, `GHLListResponse`, etc. Import from here — not from route files. |
| `lib/ghl/api.ts` | `ghlFetch` helper + `GHL_API` / `GHL_VERSION` constants. All GHL HTTP calls go through this. |
| `lib/ghl/fetchLocationData.ts` | **Shared KPI + pipeline fetch logic.** Accepts optional `dateRange` (`from`/`to`). Used by both `/api/ghl/sync` and `/report/[token]`. |
| `lib/ghl/getValidToken.ts` | Validates GHL access token, refreshes if expiring within 5 min. Marks integration inactive on refresh failure. |
| `lib/ghl/syncLocations.ts` | Fetches all sub-account locations for a GHL company via `GET /locations/?companyId={id}` and upserts to `ghl_locations`. Called after agency OAuth callback. |
| `lib/oauth-config.ts` | **Single source of truth for all OAuth providers.** Add new providers here first. Includes `getCallbackUrl()` which handles the GHL/crm alias. |
| `lib/oauth-callback.ts` | Shared OAuth callback handler — CSRF check, token exchange, `provider_user_id` fetch, `integrations` upsert. Used by the `[provider]/callback` route. |
| `lib/stripe.ts` | Stripe client singleton. |
| `lib/supabase/client.ts` | Browser Supabase client (anon key). Use in `"use client"` components. |
| `lib/supabase/server.ts` | Server Supabase client (cookie-based SSR). Use in route handlers + server components. |
| `lib/supabase/admin.ts` | Admin Supabase client (service role — bypasses RLS). Use only in webhooks and server-side utility functions. Never expose to browser. |
| `lib/ai/generateReportSummary.ts` | Calls `claude-haiku-4-5` via Anthropic SDK. Takes `GHLSyncResponse` + location name, returns up to 5 `{ heading, body }` sections. Used by the report page. |
| `lib/demo-context.ts` | `DemoContext` + `useDemoMode()` hook. Components branch on this: demo → mock data, real → live data or `"—"`. |
| `lib/mock-data.ts` | Mock data for the `/demo` page. Never remove — `/demo` must always work as a marketing tool. |

---

## Components

| File | What it does |
|---|---|
| `components/KPIBar.tsx` | Top KPI strip. Shows Meta spend/leads and GHL contacts/revenue. Skeleton loader while loading. |
| `components/SourceTable.tsx` | Per-integration data table. One row per provider with live metrics. |
| `components/PipelineFunnel.tsx` | GHL pipeline funnel — stage bars, per-stage counts, conversion rates. Tab selector when multiple pipelines. Skeleton loader. |
| `components/SettingsPage.tsx` | Settings tabs: account, team, integrations, billing. Billing tab handles subscribe + manage billing. |
| `components/IntegrationsPage.tsx` | Connect/disconnect integrations UI. Reads `integrations` table client-side for status. |
| `components/ClientSwitcher.tsx` | Agency client switcher. Searchable dropdown listing `ghl_locations`. Hidden when < 2 locations. Sits in dashboard header between title and date picker. |
| `components/DateRangePicker.tsx` | Preset date range selector (All time / Today / 7D / 30D / 90D). Passes `?from=`, `?to=`, and `?period=` (cache key) to the GHL sync route. |
| `components/Sidebar.tsx` | Left nav. Demo mode: logout suppressed (clicking does nothing). |
| `components/SourceDrawer.tsx` | Right slide-in drawer for source drill-down. Demo only for now — `onSelectSource` not passed in real mode. |
| `components/TrendChart.tsx` | Trend sparkline chart. Demo only — needs week-over-week data from `metrics` (TODO #7). |
| `components/RevenueChart.tsx` | Revenue bar chart. Demo only — needs time-series data from `metrics` (TODO #7). |
| `components/CampaignTables.tsx` | Campaign breakdown tables. Demo only — needs time-series data from `metrics` (TODO #7). |
| `components/LiveTicker.tsx` | Animated ticker at top of dashboard. |
| `components/landing/` | Landing page components (Hero, Nav, PricingSection, etc.). |

---

## Database Tables

| Table | Purpose |
|---|---|
| `organizations` | One per org. Stores name, Stripe customer/subscription info. |
| `members` | Org membership. Roles: `owner`, `member`. |
| `invites` | Pending invitations. UI not yet built. |
| `profiles` | Per-user profile data (company name, role, channels, onboarding status). |
| `integrations` | OAuth connections. One row per org+provider. Stores tokens, expiry, `provider_user_id`, status. |
| `reports` | Shareable report links. One per org today; needs `(org_id, location_id)` unique constraint once per-client report URLs are built (TODO #3). Token = access control. |
| `ghl_locations` | GHL sub-account locations synced after agency OAuth. One row per location per org. Empty for single-location connections — sync route falls back to `integrations.provider_user_id` when empty. |
| `metrics` | Hourly KPI snapshots written by the cron job. One row per `(org_id, location_id, provider, period_label)`. Read by `/api/ghl/sync` as a cache layer before hitting GHL live. |

---

## Key Patterns & Rules

**Which Supabase client to use:**
- Route handlers (user actions): `createClient()` from `lib/supabase/server` — respects RLS
- Webhooks, utility functions, admin writes: `createAdminClient()` — bypasses RLS
- Components (`"use client"`): `createClient()` from `lib/supabase/client`

**Auth validation:**
- `proxy.ts` and security-critical paths: `getUser()` — validates token server-side
- Client components (display only): `getSession()` — faster, reads from JWT

**Navigation after auth changes:**
- Always `window.location.href` — `router.push()` causes hangs due to proxy's `getUser()` call

**Demo mode:**
- Never remove mock data paths from components
- `useDemoMode()` → branch on true/false

**GHL callback URL:**
- Always use `getCallbackUrl(provider)` from `lib/oauth-config.ts` — handles the crm alias automatically

**Billing enforcement:**
- `proxy.ts` reads `stripe_subscription_status` from JWT user metadata (not DB)
- Stripe webhook updates both the DB and the user's JWT metadata on every event

**Type imports:**
- GHL types → `lib/ghl/types.ts`
- Meta types → `app/api/meta/insights/route.ts` (not yet extracted)
- Never import types from route files (use dedicated type files)
