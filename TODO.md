# SourceIQ — Implementation TODOs

---

## Immediate Next Tasks

### 1. Test GHL connect flow end-to-end
- Click Connect GHL on IntegrationsPage → pick sub-account → should land back with location showing as Active
- Verify dashboard loads real funnel data for the connected location
- Verify client switcher shows the location

### 2. Guarantee progress tracker
- "X of 15 high-ticket sales — Y days remaining" on the report page
- Needs `campaign_start_at` column on `reports` table
- Should appear in weekly and all-time views

### 3. Meta App Review — submit today
- Submit at developers.facebook.com
- Scopes: `ads_read`, `ads_management`, `leads_retrieval`
- Campaigns table + summary bar will populate once approved

### 4. Week-over-week trend on report page
- Show leads/appointments/shows this week vs. last week (delta + % change)
- Data is available live from GHL — no metrics cache needed for a two-week window
- Display as a small trend row beneath the funnel overview on the report page

---

## Core Product Priorities

### ✅ A. FunnelSnapshot Component
`FunnelSnapshot.tsx` — Lead → Booked → Showed → Paid with conversion rates + cost-per.
Demo: mock med spa numbers (247→89→61→15) + guarantee badge. Live: from `ghlData` props.

### ✅ B. Show/No-Show Confirmation on Report Page
`AppointmentConfirmList.tsx` — optimistic UI, auth via report token.
`POST /api/appointments/confirm` — validates token, upserts to `appointment_confirmations`.

### ✅ C. GHL Appointments API Integration
`lib/ghl/fetchAppointments.ts` — `GET /calendars/events?locationId&startTime&endTime`.
`bookedCount` + `showedCount` added to `GHLSyncResponse`.

### ✅ D. Report Page — Full Redesign
- Week navigator (Mon–Sun chevrons, All time toggle in header)
- Meta summary bar (leads, spend, CPL, ROAS) — date-filtered per selected week
- Campaigns table (per-campaign breakdown, horizontally scrollable)
- GHL + Meta fetched in parallel server-side
- Typography polish: base/semibold section headings, darker labels, sub-text removed from funnel stages
- AI summary all-time only (avoids overwriting cache with weekly snapshots)

---

## Before First Paying Customer

- [x] **GHL App** — sub-account app with contacts/opportunities/calendars scopes. One OAuth per location.
- [ ] **Meta App Review** — in progress (~1 week). Scopes: `ads_read`, `ads_management`, `leads_retrieval`
- [ ] **Meta Long-Lived Token** — build `lib/meta/getValidToken.ts`, exchange short-lived token after OAuth
- [ ] **Stripe Activate** — create product/price, add env vars, register webhook, set `BILLING_ENFORCEMENT=true`
- [ ] **Meta Data Deletion Webhook** — Settings → Advanced → Data Deletion Requests in Meta Developer portal

---

## Future Considerations

- **Report data snapshots** — Weekly report data is fetched live from GHL/Meta on every load; nothing is snapshotted per week. If GHL data is edited retroactively, historical report views will silently change. If the agency ever needs an audit trail or dispute resolution, consider writing a weekly snapshot to Supabase (e.g. a `report_snapshots` table keyed on `(report_id, week)`). Playing it by ear for now.

---

## Technical Debt

- **Billing page price hardcoded** — `$297/month` literal in `/billing/page.tsx`. Use `NEXT_PUBLIC_PLAN_PRICE` env var.
- **Report page: use metrics cache** — `fetchLocationData` called live on every visit. Wire to `metrics` cache before falling back.
- **Meta types not extracted** — `MetaCampaign` / `MetaReportData` declared locally in both `/api/meta/campaigns` and `/report/[token]/page.tsx`. Extract to `lib/meta/types.ts` when a third consumer appears.
- **Vercel Pro: restore hourly cron** — change `vercel.json` to `"0 * * * *"` and `CACHE_STALE_MS` back to `2h`.
- **Pre-push build check** — add git pre-push hook: `npm run build` must pass.
- **CODEBASE.md drift check** — ✅ done via pre-commit hook + `npm run check-codebase`.
