

## Plan: Fix Auth & Set Up Branded Email Templates

### Problem Analysis

The `client.ts` file contains **stale fallback URLs** from an old backend project (`viidccjyjeipulbqqwua`). While the `.env` file has the correct Lovable Cloud values (`zupjsghppxyvmgwxvycc`), this mismatch from the Claude/git work is the root cause of auth confusion. The `client.ts` is auto-generated and will sync correctly, but old migrations also reference the stale project.

### Part 1: Fix Auth Reliability

1. **Verify the client is pointing to the correct backend** — the `.env` overrides should be working, but we'll confirm by checking runtime behavior
2. **Add a cache-busting mechanism to the auth flow** — update `AuthContext.tsx` to clear any stale session data on initialization (localStorage keys from the old backend URL would cause phantom sessions)
3. **Clean sign-out** — ensure `signOut` clears all localStorage keys related to both old and new backend URLs so there's no ghost state

### Part 2: Scaffold & Brand Auth Email Templates

The email domain `notify.arcananotes.com` is verified and ready.

1. **Scaffold auth email templates** using the managed tooling (creates all 6 templates: signup confirmation, password reset, magic link, invite, email change, reauthentication)
2. **Apply Noteily/Arcana Notes branding** to all templates:
   - **Primary color**: `hsl(199, 89%, 48%)` (the app's signature cyan/blue)
   - **Font**: DM Sans with web-safe fallback
   - **Tone**: Warm, creative — matching the app's "Write What You Love" personality
   - **Logo**: Use the existing `arc-logo.png` from `src/assets/` (upload to storage bucket for email use)
   - **Email body background**: White (#ffffff) per email best practices
   - **Button style**: Rounded with the primary cyan color
3. **Deploy the `auth-email-hook` edge function**

### Technical Details

**Auth fix in `AuthContext.tsx`:**
- On mount, detect and clear any localStorage entries from the stale `viidccjyjeipulbqqwua` backend
- This ensures no phantom sessions from the old project interfere with auth

**Email template styling (applied to all 6 templates):**
- Button: `backgroundColor: hsl(199, 89%, 48%)`, `color: #ffffff`, `borderRadius: 0.75rem`
- Headings: `color: #0a0a0a`, font-family: `'DM Sans', Arial, sans-serif`
- Body text: `color: #55575d`
- Copy tone: casual and creative ("Hey there!", "Welcome to Arcana Notes", etc.)

