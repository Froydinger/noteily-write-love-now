

## Deep Dive Analysis

### Root Cause: Google Login Loop on Live

I found the smoking gun. Here's the chain of events:

**1. Stale Supabase client fallback URL**

`src/integrations/supabase/client.ts` (auto-generated, line 5-6):
```
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://viidccjyjeipulbqqwua.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'eyJ...old_key...';
```

In the **preview**, the `VITE_SUPABASE_URL` environment variable is injected at dev-server time, so the correct project (`zupjsghppxyvmgwxvycc`) is used. On the **published site**, if the build doesn't bake in these env vars (or a stale service worker serves a cached bundle), the fallback fires and the Supabase client points to the **OLD** project. That old project has no knowledge of the Lovable-managed Google OAuth, so the token exchange fails or creates a ghost session, and the app redirects back to `/` in a loop.

This file is auto-generated and you cannot edit it — but the system updates it on publish. The issue is that the **PWA service worker caches the old JS bundle** and serves it even after a new publish. Your users (including you) are hitting the cached bundle with the old fallback URL.

**2. `redirect_uri` includes a path**

The Lovable Cloud auth SDK documentation says `redirect_uri` should be `window.location.origin` (just the origin). Your code sends:
```typescript
redirect_uri: `${window.location.origin}/auth/callback`
```
The SDK handles the redirect internally via `/~oauth`, so appending `/auth/callback` may cause a mismatch where the SDK redirects to the origin but the app expects `/auth/callback`.

**3. PWA service worker aggressively caches**

The `navigateFallbackDenylist` correctly excludes `/~oauth`, but the service worker's `navigateFallback: '/index.html'` combined with `skipWaiting: true` means a stale worker can serve an outdated `index.html` that loads the old JS bundle with the old Supabase URL fallback. Every time you publish, returning users may still hit the old cached bundle until the SW updates.

### Root Cause: iOS PWA Layout

The `/home` notes screen header uses `pwa-safe-top` class which in `@media (display-mode: standalone)` adds `padding-top: calc(var(--pwa-safe-top) + 1rem)`. However, the main `AppLayout` wrapper doesn't account for the Dynamic Island area itself — there's no top-level safe area inset on the `<main>` element. The header sits behind the Dynamic Island notch area.

---

## Plan

### Part 1: Fix Google Login (3 changes)

**A. Fix `redirect_uri` to use origin only (not `/auth/callback`)**

In `src/contexts/AuthContext.tsx`, change:
```typescript
// BEFORE
redirect_uri: `${window.location.origin}${AUTH_CALLBACK_PATH}`,

// AFTER  
redirect_uri: window.location.origin,
```

The Lovable Cloud SDK (`@lovable.dev/cloud-auth-js`) handles the OAuth flow through its own `/~oauth` redirect. After the flow completes, it calls `supabase.auth.setSession(result.tokens)` directly in the browser — there is no redirect to `/auth/callback` from Google OAuth. The `/auth/callback` route is only needed for email OTP links and password reset links.

**B. Simplify `signInWithGoogle` to not set loading state**

The Google OAuth flow redirects the page away, so setting loading state is meaningless and can cause React state update warnings on unmounted components. Clean this up.

**C. Add service worker cache-bust on app load**

Add a small utility that runs at app startup to force the service worker to check for updates and, if a new version is available, activate it immediately. This ensures that after a publish, the next app load will pick up the new bundle with the correct Supabase URL.

In `src/main.tsx`, add a service worker update check that calls `registration.update()` on load and forces `skipWaiting` if a waiting worker exists.

**D. Keep `/auth/callback` route for email flows only**

The `AuthCallbackPage` is still needed for email confirmation links and password reset redirects. No changes needed there.

### Part 2: Fix iOS PWA Dynamic Island Layout (2 changes)

**A. Add safe-area-inset-top to the `<main>` element in `AppLayout`**

The `AppLayout` component wraps all authenticated content. On iOS PWA standalone mode, the main content area needs a top safe area so the sticky header doesn't sit behind the Dynamic Island.

In `src/components/layout/AppLayout.tsx`, add `pwa-safe-top` class or inline style to the `<main>` element — but only on mobile, since the desktop left sidebar already handles its own spacing.

Actually, the better fix is: the header in `Index.tsx` (line 184) already has `pwa-safe-top`, which should push it down. The issue from the screenshot is that the entire page content starts too high. The `AppLayout` main element needs `padding-top: env(safe-area-inset-top)` in standalone mode, applied via the existing CSS utility.

**B. Ensure EmptyNotesPlaceholder also respects safe area**

The empty state placeholder (`EmptyNotesPlaceholder.tsx`) is rendered without the sticky header, so it also needs the `pwa-safe-top` class on its container.

---

### Summary of file changes

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Change `redirect_uri` to `window.location.origin` (no path). Remove loading state from `signInWithGoogle`. |
| `src/main.tsx` | Add SW update-on-load logic to force stale caches to refresh. |
| `src/components/layout/AppLayout.tsx` | Add `pwa-safe-top` to main element for