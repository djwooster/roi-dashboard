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
- Tables: `organizations`, `members`, `invites`
- Use `get_my_org_id()` SECURITY DEFINER function for RLS policies on self-referencing tables — avoids infinite recursion
- All org-scoped queries should go through `org_id` from `get_my_org_id()`

## Component & File Conventions
- Auth pages: `app/(auth)/` — dark text on light background image (`/new-bg.webp`)
- Landing page components: `components/landing/`
- Dashboard components: `components/` (top-level, e.g. `Sidebar.tsx`, `SettingsPage.tsx`)
- Route groups: `(auth)` for login/signup, `dashboard` for app, `onboarding` for setup flow
- Color palette: `#0a0a0a` for dark, white for light — avoid arbitrary grays

## Framer Motion
- `ease` must be typed as a tuple: `const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]`
