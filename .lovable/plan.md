

## The Problem

There are two issues working together to break Google sign-in on `arcananotes.com`:

1. **`redirect_uri` points to `/auth/callback`** (line 189 of AuthContext.tsx). After Google completes, the Lovable managed auth bridge returns the user to `arcananotes.com/auth/callback` with tokens/code in the URL.

2. **`AuthCallbackPage.tsx` tries to process those tokens with `supabase.auth.exchangeCodeForSession()` or `supabase.auth.setSession()`** (lines 52, 60). But the Lovable managed auth bridge uses ES256-signed tokens that the standard Supabase client cannot verify — hence `"invalid JWT: signing method ES256 is invalid"`.

3. **`RootRoute` in App.tsx also forwards OAuth params from `/` to `/auth/callback`** (lines 56-67), which triggers the same broken path even if the bridge returns to the root.

The fix is simple: the managed Lovable Google flow handles session hydration automatically — it just needs to land on a page that **does not** try to manually process the tokens.

## Plan

### 1. Fix `redirect_uri` in `AuthContext.tsx`
Change Google sign-in back to `window.location.origin` (the site root, no `/auth/callback`):
```typescript
redirect_uri: window.location.origin,
```
The managed auth library will hydrate the session itself when the user lands back on the root.

### 2. Stop forwarding OAuth params to `/auth/callback` in `App.tsx`
Remove the `Navigate` to `/auth/callback` from `RootRoute`. Instead, when OAuth params are detected on `/`, show a loading spinner and let the managed auth library + `onAuthStateChange` handle session creation. Once the session exists, the existing `if (user)` check navigates to `/home`.

```typescript
function RootRoute() {
  const { user, initializing } = useAuth();
  const oauthReturning = hasAuthCallbackParams();

  if (initializing || oauthReturning) {
    return <LoadingSpinner ... text="Signing you in..." />;
  }
  if (user) return <Navigate to="/home" replace />;
  return <LanderPage />;
}
```

### 3. Narrow `AuthCallbackPage.tsx` to email-only flows
Remove the `code` exchange and hash-token `setSession` branches. Keep only OTP verification (for email confirmation, magic links, password recovery). Add a fallback that checks for an existing session and redirects to `/home`. This ensures Google tokens never hit this page, while email flows still work.

### Files changed
- `src/contexts/AuthContext.tsx` — one-line fix to `redirect_uri`
- `src/App.tsx` — remove `Navigate` to `/auth/callback`, show spinner instead
- `src/pages/AuthCallbackPage.tsx` — remove code/token exchange branches, keep OTP only

### Why this works
The Lovable managed auth bridge does its own token processing internally. It just needs the browser to land on a normal page where `onAuthStateChange` fires. By sending it to `/` (not `/auth/callback`), the managed library hydrates the session, `onAuthStateChange` fires `SIGNED_IN`, `initializing` becomes false, user is set, and RootRoute redirects to `/home`.

