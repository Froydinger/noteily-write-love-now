

## Issues Found

### 1. Emails Not Sending on Signup

The email domain is verified, the cron job is running, queues exist — but `email_send_log` is **empty**. This means the `auth-email-hook` edge function is **never being invoked** by the auth system. The hook exists and is deployed, but the auth system isn't routing emails through it.

The likely cause: after migrating to Lovable Cloud, the auth email hook needs to be **re-scaffolded and redeployed** so the system recognizes it. The current hook code may have been scaffolded for the old project. Re-scaffolding will re-register the hook with the backend so auth events are routed to it.

**Fix:**
1. Re-scaffold auth email templates (with `confirm_overwrite: true` since they already exist)
2. Re-apply the existing brand styling (cyan accent, DM Sans font, Arc logo)
3. Redeploy `auth-email-hook`

### 2. Note Editor Screen (NotePage) — Modernize Layout

The note editor page (`NotePage.tsx`) has an older design compared to the polished Index page. Specific issues:

- **Header lacks glass-morphism background** — it's transparent with no backdrop blur, so it blends poorly when scrolling
- **No safe-area handling on header** — missing `pwa-safe-top` for iOS PWA Dynamic Island
- **No image upload button visible in toolbar** — the `ImageUploadButton` component exists but isn't in the header toolbar (only `FeaturedImageUpload` is there)
- **Editor container lacks visual polish** — no card/surface treatment, raw white space

**Changes to `NotePage.tsx`:**
- Add `pwa-safe-top` to the header
- Add glass-morphism background to the sticky header (`bg-background/60 backdrop-blur-md`)
- Clean up spacing for mobile

**Changes to `NoteEditor.tsx`:**
- The editor itself is fairly clean — main improvement is ensuring the title textarea and content area feel more integrated with the modern theme (the code already uses `text-accent` for the title, which is good)

---

## File Changes

| File | Change |
|------|--------|
| Auth email templates (all 6) | Re-scaffold via tool, re-apply brand styling |
| `auth