<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project Conventions

## App Identity
- Product name: **SourceIQ** (domain: sourceiq.app)
- Founder: D. Wooster
- Stack: Next.js 16.2.1, Supabase SSR, Tailwind CSS v4, TypeScript

## Business Context (read before designing features)
SourceIQ is currently being built as **custom software for one specific marketing agency** that runs paid lead generation campaigns for med spas. Every product decision should be evaluated through this lens first.

**The agency's model:**
- Charges med spas $2,000/month retainer; med spas cover their own ad spend separately
- Runs a "grand slam offer" (Hormozi-style): guarantee 15 high-ticket sales in the first 30 days or full refund
- Almost always delivers — med spas become long-term retainer clients after month 1
- Manages GHL on behalf of all med spa clients; each med spa is a GHL sub-account

**The funnel (core of everything):**
Ad → **Lead** (opt-in) → **Appointment Booked** (via GHL calendar) → **Showed** (patron arrives at med spa) → **High-Ticket Sale** (closed won opportunity in GHL)

**The data problem this solves:**
- Agency books appointments through GHL but has no visibility into what happens at the med spa
- Med spa owners currently track show/no-show in spreadsheets — dirty, unreliable data
- SourceIQ replaces the spreadsheet: new appointments auto-appear on the client report page, med spa owner taps to confirm showed/no-show

**The weekly report is the primary client-facing deliverable:**
- `/report/[token]` is the shareable link the agency sends to each med spa every week
- It should show funnel progress, show rate, close rate, and guarantee progress
- The report page also doubles as the show/no-show confirmation interface

**Longer-term vision:**
- Use this agency as proof of concept, then niche into building custom software + automations for marketing agencies
- SourceIQ becomes a template/starting point — not a one-size-fits-all SaaS

## Next.js 16 Critical Differences
- Middleware file is **`proxy.ts`** at project root — export named `proxy`, not `middleware`
- `cookies()` from `next/headers` is **async** — always `await cookies()`
- Route handler `params` is a **Promise** — `await params` before accessing fields
- `useSearchParams()` requires a `<Suspense>` boundary (wrap in a parent component)
- Tailwind CSS v4: `@import "tailwindcss"` — no `tailwind.config.js` needed

## Supabase Auth Patterns
- **Client components** (display only): use `getSession()` — faster, no network round-trip
- **proxy.ts / security-critical paths**: use `getUser()` — validates token server-side
- Client import: `import { createClient } from "@/lib/supabase/client"`
- Server import: `import { createClient } from "@/lib/supabase/server"`
- Auth PKCE flow: email confirmation and OAuth both land at `/auth/callback`, which calls `exchangeCodeForSession(code)` then redirects
- `emailRedirectTo` is ignored by Supabase — `proxy.ts` intercepts `/?code=...` and forwards to `/auth/callback` as a workaround

## Navigation After Auth State Changes
- Always use **`window.location.href`** (hard navigation) after login, signup, logout, or onboarding completion
- Do NOT use `router.push()` after auth changes — the proxy's `getUser()` call causes hangs on soft navigation

## Multi-Tenancy (Supabase RLS)
- Tables: `organizations`, `members`, `invites`, `integrations`
- Use `get_my_org_id()` SECURITY DEFINER function for RLS policies on self-referencing tables — avoids infinite recursion
- All org-scoped queries should go through `org_id` from `get_my_org_id()`

## Integrations Pattern
- All third-party OAuth connections are stored in the `integrations` table: `org_id`, `provider`, `access_token`, `refresh_token`, `token_expires_at`, `status`, `provider_user_id`
- `provider_user_id` stores the user's ID on the external platform (e.g. Facebook UID) — required for data deletion webhooks
- OAuth config lives in `lib/oauth-config.ts` — add new providers there first
- Connect route: `app/api/integrations/[provider]/connect/route.ts` (builds OAuth URL, sets CSRF nonce cookie)
- Callback route: `app/api/integrations/[provider]/callback/route.ts` (exchanges code, upserts to integrations table, fetches provider_user_id via `userIdUrl`)
- Per-provider data sync routes live at `app/api/{provider}/` (e.g. `app/api/meta/insights/route.ts`)
- `IntegrationsPage.tsx` reads the integrations table client-side to show connected/disconnected state

## Demo Mode Pattern
- `lib/demo-context.ts` exports `DemoContext` and `useDemoMode()`
- `app/demo/page.tsx` wraps `<Dashboard>` in `<DemoContext.Provider value={true}>`
- Dashboard components call `useDemoMode()` and branch: demo → render mock data, real → render live data or "—"
- Never remove mock data from components — keep both paths so `/demo` always works as a marketing tool

## Dashboard Data Flow
- Dashboard (`app/dashboard/page.tsx`) is `"use client"` — fetches integration data on mount via `fetch("/api/{provider}/insights")`
- Real data is passed as props to `KPIBar`, `FunnelSnapshot`, etc. (`metaData`, `ghlData`)
- Components show "—" with `text-[#d4d4d4]` for missing values; real values use `text-[#0a0a0a]`
- `SourceDrawer` drill-down is demo-only for now — only pass `onSelectSource` when `useDemoMode()` is true

## Component & File Conventions
- Auth pages: `app/(auth)/` — dark text on light background image (`/new-bg.webp`)
- Landing page components: `components/landing/`
- Dashboard components: `components/` (top-level, e.g. `Sidebar.tsx`, `SettingsPage.tsx`)
- Route groups: `(auth)` for login/signup, `dashboard` for app, `onboarding` for setup flow
- Compliance/public pages: `app/privacy/`, `app/webhooks/` — no auth required, must remain publicly accessible
- Color palette: `#0a0a0a` for dark, white for light — avoid arbitrary grays

## Framer Motion
- `ease` must be typed as a tuple: `const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]`

## Code Comments
Comment every file for a contract developer: explain **why** decisions were made (why admin vs user client, why a workaround exists, why something is inside/outside try-catch). When touching an uncommented file, add comments.

## Workflow
- Do **not** commit or push after every task — the user tests in dev first and commits explicitly.

## Reference Files
- `CODEBASE.md` — full map of routes, pages, lib files, components, DB tables. Check before creating files.
- `TODO.md` — active task list
- `lib/oauth-config.ts` — single source of truth for OAuth provider configs
