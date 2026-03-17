
Goal: fix Google sign-in so it works on the live site/PWA without looping or throwing the invalid JWT error, and remove the remaining stale runtime coupling to the old backend.

What I found
- The Google auth itself is succeeding in the backend. Your auth logs show repeated successful Google logins and `POST /token` responses with status 200.
- That means this is not primarily an account-type, RLS, or table-schema problem.
- The failure is happening after Google returns, while the app is trying to hydrate/use the session on the client.
- The strongest runtime red flag is `src/integrations/supabase/client.ts`: its fallback URL/key still point to the old project (`viidccjyjeipulbqqwua`). That matches the exact “invalid JWT / signature” symptom: the app gets a token from the current backend, then part of the client flow tries to use it against stale project settings.
- `src/lib/authStorage.ts` no longer clears stale old-project auth on startup. So old cached session keys can still interfere with login persistence and cause “logged out randomly” behavior.
- `vite.config.ts` already denylists `/~oauth`, so the service worker is not the main blocker here.
- I checked the live database objects: there are no active DB functions/triggers still pointing at the old project URL. The old refs I found in `supabase/migrations/*.sql` are historical files, not active runtime logic.
- There is still an old Google/provider-related DB function (`get_user_by_identifier` returning `has_google_auth`), but that is cleanup work, not the cause of this login failure.

Implementation plan
1. Fix the runtime auth source of truth
- Re-sync the frontend auth client to the current Lovable Cloud project so the published app cannot fall back to the old backend during session exchange/restore.
- I will treat this as the primary fix, because it directly matches the JWT signature error.

2. Harden session bootstrapping
- Restore a targeted “stale auth cleanup” pass on app startup that removes only old-project auth keys before `onAuthStateChange` / `getSession()` runs.
- Keep current-session persistence intact so users stay logged in until they explicitly log out or clear storage.

3. Simplify and stabilize the Google callback flow
- Tighten `AuthCallbackPage` so it completes auth exactly once and avoids double-handling tokens.
- Prefer a single successful path: existing valid session -> code exchange -> token set -> success.
- Keep URL cleanup after success/failure so callback params do not get reprocessed on refresh.

4. Verify the Google button flow end-to-end
- Keep the Google button in `LoginDialog`, but make sure it always redirects into the corrected callback/session path.
- If custom-domain behavior is still broken after the stale-client fix, I’ll add a domain-aware fallback for OAuth redirect handling. That is secondary, because the current evidence points first to stale backend/client mismatch.

5. Clean leftover old-project / old-OAuth references
- Remove remaining runtime references to the old backend.
- Clean provider-specific leftovers that are no longer needed for app logic.
- Separately clean the dead historical migration-file refs if you want the repo itself fully stripped, even though they are not running in production.

Files I would update
- `src/contexts/AuthContext.tsx`
- `src/lib/authStorage.ts`
- `src/pages/AuthCallbackPage.tsx`
- `src/components/auth/LoginDialog.tsx`
- possibly generated auth/backend integration via proper re-sync rather than hand-editing generated code
- optional cleanup: DB function usage tied to `has_google_auth`, plus stale migration references in `supabase/migrations`

What I do not think needs changing for the fix
- No auth table redesign
- No RLS rewrite
- No user account type changes
- No subscription/Stripe changes
- No PWA routing overhaul beyond validating current behavior

Validation checklist after implementation
- Google sign-in from the published site lands on `/home`, not `/`
- No “invalid JWT / ES256” error on callback
- Refreshing after login keeps the user signed in
- Closing/reopening the app keeps the session
- Installed PWA login also returns to `/home`
- Email/password login still works and stays persistent
- Explicit logout still clears the session correctly
