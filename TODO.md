# SourceIQ — Implementation TODOs

---

## Uncommitted changes — test in dev, then commit

All of these are working code, not yet committed:

- **Google Ads removal** — stripped from `lib/oauth-config.ts`, `IntegrationsPage.tsx`, `app/onboarding/page.tsx`, `lib/mock-data.ts`, `SourceTable.tsx`, `KPIBar.tsx`, `CampaignTables.tsx`, `LiveTicker.tsx`, and all landing page components
- **Doc trimming** — `TODO.md`, `AGENTS.md`, `CODEBASE.md` slimmed down significantly
- **GHL one-auth consolidation** — single sub-account app replaces agency app; `oauth-config.ts` updated to use `GHL_SUBACCOUNT_CLIENT_ID/SECRET` + sub-account scopes; `oauth-callback.ts` auto-upserts `ghl_locations` on connect; `IntegrationsPage` simplified
- **Top Campaigns section** — `components/TopCampaigns.tsx` + `GET /api/meta/campaigns` (campaign-level Meta breakdown, sorted by leads); replaces demo-only `CampaignTables` in dashboard
- **SQL migration** — `appointment_confirmations` table created; `ghl_locations` token columns added

---

## Immediate next tasks

### 1. Test GHL connect flow end-to-end
- Click Connect GHL on IntegrationsPage → pick sub-account → should land back with location showing as Active
- Verify dashboard loads real funnel data for the connected location
- Verify client switcher shows the location

### 2. Weekly report enhancements
- [ ] Guarantee progress tracker ("X of 15 high-ticket sales — Y days remaining") — needs `campaign_start_at` column on `reports` table
- [ ] Design pass on report page

---

## Core Product Priorities

### ✅ A. FunnelSnapshot Component
`FunnelSnapshot.tsx` — Lead → Booked → Showed → Paid with conversion rates + cost-per.
Demo: mock med spa numbers (247→89→61→15) + guarantee badge. Live: from `ghlData` props.

### ✅ B. Show/No-Show Confirmation on Report Page
`AppointmentConfirmList.tsx` — optimistic UI, auth via report token.
`POST /api/appointments/confirm` — validates token, upserts to `appointment_confirmations`.
**SQL migration now done — unblocked.**

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
