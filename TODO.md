# SourceIQ — Implementation TODOs

---

## Uncommitted changes — test in dev, then commit

All of these are working code, not yet committed:

- **Google Ads removal** — stripped from `lib/oauth-config.ts`, `IntegrationsPage.tsx`, `app/onboarding/page.tsx`, `lib/mock-data.ts`, `SourceTable.tsx`, `KPIBar.tsx`, `CampaignTables.tsx`, `LiveTicker.tsx`, and all landing page components
- **Doc trimming** — `TODO.md`, `AGENTS.md`, `CODEBASE.md` slimmed down significantly

---

## Immediate next tasks

### 1. Run SQL migration in Supabase (manual — SQL Editor)
Two migrations needed before the funnel data will actually work:

```sql
-- Table for show/no-show confirmations (Priority B)
CREATE TABLE appointment_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  location_id text NOT NULL,
  ghl_appointment_id text NOT NULL,
  contact_name text,
  appointment_at timestamptz,
  outcome text CHECK (outcome IN ('showed', 'no_show')),
  confirmed_at timestamptz,
  UNIQUE (org_id, ghl_appointment_id)
);

-- Token columns for per-location sub-account OAuth (already built, needs schema)
ALTER TABLE ghl_locations
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
```

### 2. Build "Sync Locations" button on IntegrationsPage
When the agency adds a new med spa to GHL, locations don't auto-update in SourceIQ. Fix:

- **New API route:** `GET /api/ghl/sync-locations` — validates user session + org, fetches active GHL integration token (`getValidGHLToken`), calls `syncGHLLocations(orgId, companyId, token)`, returns `{ synced: N }`
- **IntegrationsPage UI:** Add a "Sync locations" button next to the GHL connected badge. Shows count of synced locations. Calls the new route, refreshes `ghlLocations` state on success.
- Note: `companyId` is stored as `integrations.provider_user_id` for agency GHL connects

### 3. Per-location sub-account OAuth connect UI (IntegrationsPage)
Each location in `ghl_locations` starts with `status: 'pending'` and no tokens. To get real funnel data (contacts, opportunities, calendar appointments) each location needs its own OAuth connect.

- IntegrationsPage already loads the `ghl_locations` list — add a connect button per location
- Clicking connects routes to `/api/integrations/loc/connect?locationId={id}` (the sub-account OAuth flow is already built in code)
- Connected locations show green badge; pending show a "Connect" button
- After connect, the location gets `status: 'active'` and real data flows

### 4. GHL sub-account app setup (manual steps in GHL marketplace)
- Create sub-account app: Target User = Sub-Account, scopes = `contacts.readonly` + `opportunities.readonly` + `calendars.readonly`
- Redirect URLs: `https://sourceiq.app/api/integrations/loc/callback` + `http://localhost:3000/api/integrations/loc/callback`
- Add env vars: `GHL_SUBACCOUNT_CLIENT_ID`, `GHL_SUBACCOUNT_CLIENT_SECRET` (to `.env.local` + Vercel)

---

## Core Product Priorities

### ✅ A. FunnelSnapshot Component
`FunnelSnapshot.tsx` — Lead → Booked → Showed → Paid with conversion rates + cost-per.
Demo: mock med spa numbers (247→89→61→15) + guarantee badge. Live: from `ghlData` props.

### ✅ B. Show/No-Show Confirmation on Report Page
`AppointmentConfirmList.tsx` — optimistic UI, auth via report token.
`POST /api/appointments/confirm` — validates token, upserts to `appointment_confirmations`.
**Blocked on: SQL migration (task 1 above).**

### ✅ C. GHL Appointments API Integration
`lib/ghl/fetchAppointments.ts` — `GET /calendars/events?locationId&startTime&endTime`.
`bookedCount` + `showedCount` added to `GHLSyncResponse`.
**Blocked on: `calendars.readonly` scope (task 4 above).**

### D. Weekly Report Enhancement
- [ ] Guarantee progress tracker ("X of 15 high-ticket sales — Y days remaining") — needs `campaign_start_at` column on `reports` table
- [ ] Design pass on report page (currently functional but rough)

---

## Before First Paying Customer

- [ ] **GHL Agency App Published** — add redirect URIs, scopes, Save/Publish in marketplace.gohighlevel.com
- [ ] **Meta App Review** — submit at developers.facebook.com. Scopes: `ads_read`, `ads_management`, `leads_retrieval`
- [ ] **Meta Long-Lived Token** — build `lib/meta/getValidToken.ts`, exchange short-lived token after OAuth
- [ ] **Stripe Activate** — create product/price, add env vars, register webhook, set `BILLING_ENFORCEMENT=true`
- [ ] **Meta Data Deletion Webhook** — Settings → Advanced → Data Deletion Requests in Meta Developer portal

---

## Technical Debt

- **Billing page price hardcoded** — `$297/month` literal in `/billing/page.tsx`. Use `NEXT_PUBLIC_PLAN_PRICE` env var.
- **Report page: use metrics cache** — `fetchLocationData` called live on every visit. Wire to `metrics` cache before falling back.
- **Vercel Pro: restore hourly cron** — change `vercel.json` to `"0 * * * *"` and `CACHE_STALE_MS` back to `2h`.
- **Pre-push build check** — add git pre-push hook: `npm run build` must pass.
