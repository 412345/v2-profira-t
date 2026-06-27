# PROFIRA v2 — Gap Plan

Most of the spec is already built in this project (landing `/`, `/home` with hero/chips/perf/candles/calculator/reviews/CTA + floating nav, waitlist dialog, `/signin` with blocked-signup messaging, admin waitlist panel, Supabase auth). This plan only covers the **missing deltas** so we don't churn working UI and don't break Vercel.

## What's actually missing

1. Resend approval email when admin approves a waitlist entry
2. `email_templates` table + default `approval_notification` template
3. `waitlist.resend_email_sent_at` + `waitlist.resend_email_status` columns
4. `sendApprovalEmail` + `checkWaitlistStatus` server fns
5. Admin "Approve" action wired to send the email and surface failures
6. `.env.example` for Vercel
7. Quick UI polish pass against the spec (only if anything diverges — most matches)

## Resend setup (needs your input)

Resend is not yet connected to this workspace. Two options:

- **A. Resend connector (recommended)** — I'll trigger the connect flow; you authorize once and `RESEND_API_KEY` becomes available server-side. Calls go through Lovable's connector gateway, no key in code.
- **B. Manual API key** — you paste a Resend API key and I store it as a secret.

Either way the verified **from address** must be set. Until your domain is verified at Resend, sends only work to the Resend account owner's email via `onboarding@resend.dev`.

I'll pause after the plan is approved to ask which option + the from address.

## Database migration

Single migration:
- `ALTER TABLE public.waitlist ADD COLUMN resend_email_sent_at timestamptz, ADD COLUMN resend_email_status text NOT NULL DEFAULT 'pending'` (values: `pending | sent | failed | skipped`)
- `CREATE TABLE public.email_templates (id uuid pk, name text unique, subject text, html_body text, created_at timestamptz default now())` + GRANTs (service_role only — templates read server-side) + RLS enabled, admin-only select policy via `has_role`
- Seed row: `name='approval_notification'`, subject `"Your PROFIRA Account Has Been Approved"`, branded dark HTML with signin link + `{{tempCode}}` placeholder

## Server functions

New file `src/lib/admin/email.functions.ts`:
- `sendApprovalEmail({ waitlistId })` — `requireSupabaseAuth` + `assertStaff`. Loads waitlist row + template, generates 6-digit temp code, calls Resend via gateway (`POST https://connector-gateway.lovable.dev/resend/emails`), updates `resend_email_sent_at` + `resend_email_status`. Returns `{ ok, status }`. On failure: status='failed', error message bubbled to caller.

New file `src/lib/public/waitlist-status.functions.ts`:
- `checkWaitlistStatus({ email })` — public (no auth), uses server publishable client, narrow SELECT on `email, status, approved_at`. Requires an `anon` SELECT policy on those columns (added in the same migration scoped to `email = lower(input)` via a SECURITY DEFINER RPC to avoid leaking the table). Implementation: SQL function `public.get_waitlist_status(_email text)` returning `(status text, approved_at timestamptz)`, granted to `anon`. The server fn calls the RPC.

Edit `src/lib/admin/waitlist.functions.ts`:
- After `setWaitlistStatus` flips to `approved`, call `sendApprovalEmail` inline. Return `{ ok, emailStatus }` so the admin UI can toast "Approved + emailed" vs "Approved but email failed".

Edit `src/lib/public/waitlist.functions.ts`:
- Already returns `{ ok, duplicate }` — no change.

## Admin UI

`src/routes/_authenticated/admin.waitlist.tsx`:
- Update approve handler to read `emailStatus` from response, toast success/failure accordingly.
- Add a small badge column showing `resend_email_status` (pending/sent/failed) with a "Resend email" button on failed rows that calls `sendApprovalEmail` directly.

## Vercel hygiene

- Add `.env.example` listing: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `RESEND_API_KEY` (with comments — no real values).
- Confirm `vite.config.ts` and `vercel.json` unchanged (already correct).
- No new dependencies — Resend is called via `fetch` to the connector gateway.

## UI spec check

The existing `/`, `/home`, waitlist dialog, `/signin`, and floating nav already match the brief (crimson #D61F3A, dark cards, rounded-full CTAs, lock footer, bottom nav on /home only, etc.). I won't rewrite them. If you spot any specific element that diverges from the brief after this lands, point it out and I'll patch just that.

## What I will NOT change

- Existing admin routes, auth flow, RLS policies on existing tables, `vite.config.ts`, `vercel.json`, Supabase auto-generated files.

## Order of operations after approval

1. Ask: Resend connector vs manual key + verified from address.
2. Run migration (waitlist columns + `email_templates` + `get_waitlist_status` RPC + seed template).
3. Add the three server fn files / edits.
4. Wire admin approve UI + status badge.
5. Add `.env.example`.
6. `bun run build` smoke test.