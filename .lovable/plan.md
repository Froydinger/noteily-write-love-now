

## Plan: Fix Login Loop + Update Auth Dialog

### Problem
1. **`client.ts` has stale fallback URLs** from the old project (`viidccjyjeipulbqqwua`). Auth logs show `403: invalid claim: missing sub claim` and repeated Google logins (4+ in 2 minutes). The env vars override works in dev but may not in production builds.
2. **Conditional route rendering** based on `user` causes a flash where the lander re-renders between auth state changes.
3. **Login dialog needs restructuring** — "Create account" should show Google as an option, not force email-only. Per user's preference: Google + email only (remove username sign-in).

### Part 1: Fix the Login Loop (Critical)

**File: `src/contexts/AuthContext.tsx`**
- Add `console.log` for auth state change events with the event type so we can trace exactly what happens
- Add a guard: after `signInWithGoogle` returns with `result.redirected`, don't try to close dialog or set loading false (the page is navigating away)
- On `onAuthStateChange`, log the event type (`SIGNED_IN`, `TOKEN_REFRESHED`, `INITIAL_SESSION`, etc.) to aid debugging
- Remove `resolveAuthIdentity` since we're dropping username sign-in — just pass email directly to `signInWithPassword`
- Remove the `get_user_by_identifier` RPC call from sign-in flow entirely (it can fail and block login)
- Keep `requestPasswordReset` simple — just call `resetPasswordForEmail` with whatever email they typed

**File: `src/App.tsx`**
- Replace conditional route rendering (`{user ? ... : ...}`) with a single set of routes that always exist
- Use a `ProtectedRoute` wrapper component that checks `user` and redirects to `/` (lander) if not authenticated
- The lander route at `/` checks if user exists and redirects to `/dashboard` (or renders lander)
- This prevents React from unmounting/remounting entire route trees when auth state changes, which causes the loop

**File: `src/integrations/supabase/client.ts`**
- This file is auto-generated and should NOT be edited. However, the stale fallbacks are the real problem. The `.env` file should have the correct values. Since we can't edit client.ts, we need to ensure the auth context handles the case where the client might briefly be misconfigured.

### Part 2: Fix the Login Dialog

**File: `src/components/auth/LoginDialog.tsx`**
- Restructure the `choice` step:
  - **"Continue with Google"** (top, primary — handles both sign-in and sign-up)
  - Divider: "Or use email"
  - **"Sign in with email"** → goes to email input → password
  - **"Create account with email"** → goes to email input → password
- Remove username support from the email input (always `type="email"`, always `placeholder="Enter your email"`)
- For sign-in, still allow typing email directly (no username lookup)
- For `handleGoogleSignIn`: don't set `isLoading(false)` after calling — the page redirects, so any state update is irrelevant and can cause a flash

### Part 3: iOS PWA Safe Areas (Landing Page)

**File: `src/pages/LanderPage.tsx`**
- The `pwa-safe-top` class is already applied to both navs. The CSS rule only activates in `display-mode: standalone` which is correct.
- Verify the sticky header has `top: 0` plus safe area — currently it uses `style={{ top: 0 }}` but the `pwa-safe-top` adds padding-top, which means the header itself shifts down but the `top: 0` is correct. This should already work.
- The issue is the fixed sticky header: it needs `top: env(safe-area-inset-top)` instead of `top: 0` so it sits below the Dynamic Island, and its children don't need additional padding.
- For the top nav (non-sticky): `pwa-safe-top` with padding is correct.

### Files Changed
1. `src/contexts/AuthContext.tsx` — Simplify auth (remove username lookup from sign-in), add debug logging for auth events
2. `src/components/auth/LoginDialog.tsx` — Restructure choice screen (Google works for both), remove username support, fix Google sign-in loading state
3. `src/App.tsx` — Replace conditional routes with stable route tree + redirect logic to prevent unmount/remount loop
4. `src/pages/LanderPage.tsx` — Fix sticky header `top` value for iOS PWA safe area

