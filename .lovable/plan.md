
Goal: make Google sign-in work reliably again under Lovable Cloud, especially after the old backend migration.

What I found:
- Your app is already using the managed Lovable Google flow in `AuthContext.tsx`.
- The published app has a custom domain configured: `noteily.app`.
- The current code already has the earlier fixes:
  - Google uses `redirect_uri: window.location.origin`
  - `/~oauth` is excluded from the PWA service worker
  - startup forces service worker updates
- Because those fixes are already present and Google still fails, the most likely remaining root cause is the custom-domain OAuth bridge issue: on custom domains, the managed browser redirect can bounce incorrectly and create the “works before publish / fails after publish” loop.
- I also found legacy old-project references still in generated/fallback places, which makes stale-session behavior more likely during migration, even if the main fix is the redirect flow.

Implementation plan:
1. Make Google sign-in domain-aware in `src/contexts/AuthContext.tsx`
   - Detect whether the app is running on a Lovable-hosted domain or on `noteily.app`.
   - Keep the current managed Lovable flow for `*.lovable.app`.
   - For the custom domain only, bypass the problematic browser redirect by:
     - requesting the Google OAuth URL manually
     - using `skipBrowserRedirect: true`
     - redirecting the browser ourselves after validating the returned URL host

2. Use the existing `/auth/callback` route for the custom-domain branch
   - The custom-domain branch should send users to `/auth/callback` after Google returns.
   - `AuthCallbackPage.tsx` already supports exchanging a code for a session, so this route can be reused instead of inventing a new flow.

3. Add a one-time legacy auth cache cleanup during Google launch
   - Before starting Google sign-in, clear legacy auth storage keys from the old integration so the migrated app cannot hydrate against stale tokens.
   - Keep current-project auth intact after the migration path is complete.

4. Do not edit generated integration files
   - Leave `src/integrations/lovable/index.ts` and `src/integrations/supabase/client.ts` untouched.
   - Fix this only in app code around the Google sign-in decision.

5. Keep the email/password flow unchanged
   - Email auth already works.
   - This fix should be isolated to Google so it doesn’t destabilize the working login path.

Technical details:
- File to update: `src/contexts/AuthContext.tsx`
- Main logic:
  - `isCustomDomain = !hostname.includes("lovable.app") && !hostname.includes("lovableproject.com")`
  - If not custom domain:
    - continue using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } })`
  - If custom domain:
    - call `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth/callback", skipBrowserRedirect: true, queryParams: { prompt: "select_account" } } })`
    - validate the returned URL before `window.location.href = data.url`
    - allow only the current backend auth host and Google OAuth hosts
- Reuse `src/pages/AuthCallbackPage.tsx` as-is, with only minimal hardening if needed.
- Optional small improvement: add logging/toast messaging that shows which branch was used during sign-in.

Why this is the right “last solution”:
- It preserves the normal Lovable-managed Google path where it already works best.
- It only applies the manual redirect workaround where custom domains are known to break OAuth bridging.
- It fits your exact migration story: old backend + new Lovable Cloud + published/custom-domain failures.
- It avoids changing generated backend integration code, which would be brittle and likely overwritten later.

Files expected to change:
- `src/contexts/AuthContext.tsx`
- Possibly a tiny helper in `src/lib/` for hostname / URL validation
- Only minor or no changes in `src/pages/AuthCallbackPage.tsx`

Validation after implementation:
1. Test Google sign-in on `noteily-minimal-notes.lovable.app`
2. Test Google sign-in on `noteily.app`
3. Test on a clean incognito session
4. Confirm email/password still works
5. Confirm the app lands on `/home` with a real session after Google auth, not back at `/`
