## Root cause

The waitlist "Send email" flow calls `sendApprovalEmailForWaitlistId` with `supabaseAdmin` (service-role client). `supabaseAdmin` reads `process.env.SUPABASE_SERVICE_ROLE_KEY` lazily on first use and throws the exact error you see when it's missing.

- On Lovable preview: Lovable Cloud auto-injects `SUPABASE_SERVICE_ROLE_KEY` into the server runtime, so it works.
- On Vercel: that variable is **not** auto-injected. Your Vercel project only has `VITE_SUPABASE_*` / `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `RESEND_API_KEY`. The service-role key was never added, so the call blows up the moment an admin clicks Send.

Nothing about Resend, the email content, or the admin UI is wrong — it dies before the Resend call, while constructing the admin Supabase client.

## Fix (two parts)

### Part 1 — Code: stop needing service-role for this flow

The approval-email server fn is already gated by `requireSupabaseAuth` + `assertStaff`, so the calling admin's own Supabase session has full rights via RLS to read the `waitlist` row and update `resend_email_status`. There is no reason to escalate to service-role here.

Change `src/lib/admin/email.functions.ts`:
- Stop importing `supabaseAdmin`.
- Pass `context.supabase` (the authenticated staff client from `requireSupabaseAuth`) into `sendApprovalEmailForWaitlistId`.

`sendApprovalEmailForWaitlistId` already accepts a `SupabaseClient` parameter, so `email.server.ts` needs no changes.

Result: the Send-email button works on Vercel using only the keys you already have (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`) — no service-role required.

### Part 2 — Vercel env (recommended hardening, not blocking)

Even after Part 1, you should still set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview) so any future admin/maintenance code that legitimately needs service-role works:

- `SUPABASE_SERVICE_ROLE_KEY` = your project's service role key
- Confirm `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_ADDRESS` (optional) are also present.

Then redeploy. (Lovable Cloud doesn't expose the service-role key in the UI, so you'll need to grab it from wherever you have it stored; if you don't have it, Part 1 alone unblocks the email flow.)

## Files touched

- `src/lib/admin/email.functions.ts` — swap `supabaseAdmin` for `context.supabase`.

## Out of scope

- Email HTML/content, sender address, signup link, RLS policies, admin UI, toast handling — all unchanged.
