# SourceIQ — Codebase Map

Quick reference for navigating the codebase. Check here before reading files or creating new ones.
Keep this updated when adding routes, components, or lib files.

> **Current build target:** Custom software for one marketing agency specializing in med spa lead generation.
> Core funnel: **Lead → Booked → Showed → Paid**. The weekly client report (`/report/[token]`) is the
> primary deliverable. Show/no-show confirmation (med spa owners tap to confirm) replaces spreadsheet tracking.
> See `AGENTS.md` → Business Context for full background before designing new features.

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
| `/api/appointments/confirm` | POST | report token | Upserts show/no-show outcome to `appointment_confirmations`. Auth via report token (no session required). |
| `/api/invites` | — | — | Stub — invite flow not yet built. |
| `/api/invites/accept` | POST | user session | Accepts a pending invite by token. Updates `invites` table and adds user to `members`. |
| `/api/account` | DELETE | user session | Permanently deletes the authenticated user and their org data. |
| `/api/ghl/sync-locations` | GET | user session | Manually triggers a GHL location sync for the org. Calls `syncGHLLocations`. |
| `/api/integrations/loc/connect` | GET | user session | GHL sub-account (location-level) OAuth connect. Separate from `[provider]/connect` because config differs from agency OAuth. |
| `/api/integrations/loc/callback` | GET | none | GHL sub-account OAuth callback. Exchanges code for location-scoped token. |
| `/api/meta/campaigns` | GET | user session | Returns Meta campaign breakdown (spend, leads per campaign) from the connected ad account. |

---

## Pages

| Path | Auth required | What it does |
|---|---|---|
| `/` | none | Landing page (marketing). Authenticated users redirect to `/dashboard`. |
| `/demo` | none | Marketing demo — Dashboard wrapped in `DemoContext.Provider`. Always uses mock data. |
| `/dashboard` | user + onboarding | Main app. Loads `ghl_locations` on mount, resolves active location, fetches GHL + Meta. Header has ClientSwitcher + DateRangePicker. |
| `/onboarding` | user | Org setup form. Calls `create_org_with_owner` RPC (atomic — org + member + profile in one transaction). |
| `/report/[token]` | none (token = auth) | Public client report. Accepts `?week=YYYY-MM-DD` (Monday) for weekly view; omit for all-time. Fetches GHL + Meta in parallel server-side (Meta uses stored org token — no user session needed). Sections: week nav (chevrons + All time toggle in header), Meta summary bar (leads/spend/CPL/ROAS), campaigns table, funnel overview, pipeline leaderboard, appointment confirmations, AI summary (all-time only, cached 24h). Mobile-first. |
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
| `lib/ghl/fetchAppointments.ts` | Fetches GHL calendar appointments for a location + date range. Used to populate the appointment confirm list on the report page. |
| `lib/ghl/getLocationToken.ts` | Exchanges a company-level (agency) GHL token for a location-scoped token. Needed for sub-account API calls when only agency token is stored. |
| `lib/utils.ts` | shadcn `cn()` utility — merges Tailwind class names. Auto-generated by shadcn init, required by all shadcn components. |

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
| `components/FunnelSnapshot.tsx` | Lead → Booked → Showed → Paid funnel. Dashboard main view. Demo: mock med spa numbers + guarantee badge. Live: from `ghlData`. |
| `components/AppointmentConfirmList.tsx` | `"use client"` — appointment list with Showed/No Show buttons. Used on report page. Auth via report token. |
| `components/CampaignTables.tsx` | Campaign breakdown tables. Demo only — needs time-series data from `metrics` (TODO #7). |
| `components/LiveTicker.tsx` | Scrolling ticker of rotating marketing messages. Used on landing page. |
| `components/PipelineLeaderboard.tsx` | Sortable side-by-side comparison of all GHL pipelines. Complements `PipelineFunnel` — shows relative pipeline performance rather than single-pipeline stage breakdown. |
| `components/TopCampaigns.tsx` | Top Meta campaigns by spend/leads. Demo + live (calls `/api/meta/campaigns`). |
| `components/landing/` | Landing page components: `ArrowButton`, `CTASection`, `FeaturesSection`, `Footer`, `IntegrationsSection`, `ProblemSection`, `PricingSection`, plus Hero and Nav. |

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
| `appointment_confirmations` | Show/no-show confirmations from med spa owners. Written by `POST /api/appointments/confirm` (token auth). `outcome` = `showed` or `no_show`. **Requires SQL migration — see TODO 1a.** |

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

**GHL token resolution — always use both sources:**
- Single-location OAuth → token in `integrations` table (`provider_user_id` = locationId); `ghl_locations` row exists but has no token
- Agency/multi-location OAuth → token in `ghl_locations`
- Any route calling GHL must try `getValidLocationToken` first, then fall back to `getValidGHLToken` — never assume one table

**GHL scopes — two separate scope lists, both must be kept in sync:**
- Agency OAuth: scopes live in `lib/oauth-config.ts`
- Sub-account (loc) OAuth: scopes are hardcoded in `app/api/integrations/loc/connect/route.ts` (`const SCOPES = [...]`) — **not** in oauth-config.ts
- Enabling a scope in the GHL Marketplace app only permits it; the token only receives scopes requested in the OAuth URL at connect time
- Changing either side requires the user to disconnect + reconnect to get a new token
- The agency token does **not** have sub-account calendar scopes — `getValidLocationToken` must return a valid loc token for calendar fetches to work

**Billing enforcement:**
- `proxy.ts` reads `stripe_subscription_status` from JWT user metadata (not DB)
- Stripe webhook updates both the DB and the user's JWT metadata on every event

**Type imports:**
- GHL types → `lib/ghl/types.ts`
- Meta types → `app/api/meta/insights/route.ts` (not yet extracted)
- Never import types from route files (use dedicated type files)
