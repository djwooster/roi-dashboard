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

### 3. Meta App Review — submitted 2026-04-17, awaiting approval (~10 days)
- Submitted scopes: `ads_read` + `public_profile` only
- Do NOT push changes to Facebook OAuth flow, integrations UI, or callback routes while review is in flight
- Once approved: bump Graph API version from v19.0 → v21.0 in `app/api/meta/insights/route.ts` and `app/api/meta/campaigns/route.ts`

### 4. Week-over-week trend on report page
- Show leads/appointments/shows this week vs. last week (delta + % change)
- Data is available live from GHL — no metrics cache needed for a two-week window
- Display as a small trend row beneath the funnel overview on the report page

---

### 5. Refine onboarding screen
- Current flow works but UX can be improved
- Review copy, field layout, visual polish, and first-impression feel
- `app/onboarding/page.tsx`

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
- [ ] **Meta App Review** — submitted 2026-04-17, awaiting approval. Scopes: `ads_read` + `public_profile`
- [x] **Meta Long-Lived Token** — `lib/meta/getValidToken.ts` built, re-exchanges tokens within 7-day expiry buffer
- [ ] **Stripe Activate** — create product/price, add env vars, register webhook, set `BILLING_ENFORCEMENT=true`
- [x] **Meta Data Deletion Webhook** — live at `sourceiq.app/webhooks/meta/data-deletion`, registered in Meta Developer portal
- [ ] **Bot signup prevention** — bots hitting /signup; enable Supabase email confirmation or add Cloudflare Turnstile

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
