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
- Real data is passed as props to `KPIBar` and `SourceTable` (`metaData`, etc.)
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
Every file should be commented as if a contract developer is reading it for the first time.
Comments should explain **why** decisions were made, not just what the code does.

Good comment targets:
- Why a specific client (admin vs user-scoped) is used
- Why a workaround or non-obvious pattern exists (e.g. the `emailRedirectTo` proxy workaround)
- Why an event or status maps the way it does
- Why something is outside a try/catch (or inside one)
- Any Stripe, Supabase, or Next.js quirk that isn't obvious from the docs

When touching an existing file that lacks comments, add them — don't leave it uncommented just because it wasn't written that way originally.

## Reference Files
- `CODEBASE.md` — **start here**. Full map of every route, page, lib file, component, and DB table. Check before reading files or creating new ones.
- `TODO.md` — implementation task list with context on what's built vs. pending
- `.env.example` — all required environment variables with descriptions
- `lib/oauth-config.ts` — single source of truth for all OAuth provider configs
