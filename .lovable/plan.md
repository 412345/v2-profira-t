# Investment Approval Confirmation Email

Send a branded "payment confirmed" email to the investor when an admin approves their investment request. Auto-fire on approval, plus a manual "Send/Resend Email" button in the review drawer for already-approved requests (or when an auto-send failed). Uses the same Resend sender as the waitlist email (`onboarding@mail.profiratrade.in`).

## Email content (professionally drafted)

- **Subject**: `{FirstName}, your investment of ₹{amount} is confirmed`
- **Header**: PROFIRA TRADE · Private Investment Desk (same shell as waitlist email)
- **Hero line**: "Congratulations, {Name} — your capital has been received and deployed."
- **Body**: Short paragraph confirming the principal is now live in the managed strategy and monthly payouts are scheduled.
- **Payment Invoice block** (boxed, monospace where relevant):
  - Reference No. (e.g. `PRT-2026-000123`)
  - Transaction / UTR ID
  - Amount Confirmed (₹ formatted)
  - Date of Confirmation (IST)
  - Tenure: 6 months · Monthly payout: 10%
  - Projected monthly payout (₹) and maturity total (₹)
- **Verification checklist** (✓ ticked items):
  - KYC & banking details verified
  - Agreement & Terms accepted
  - Payment received and reconciled
  - Investment activated on the managed desk
- **CTA button** (#D61F3A): `VIEW PORTFOLIO` → `https://www.profiratrade.in/portfolio`
- **Footer note**: "Your portfolio and dashboard have been updated. Sign in any time to track real-time performance, monthly payouts, and download your agreement."
- Support line + Profira footer (same as waitlist email).
- Plain-text alternative for deliverability.

## Trigger behavior

1. **Automatic** — when admin clicks "Approve & Generate Documents" in the review drawer, the email fires immediately after the approval RPC succeeds. Email failure does NOT roll back the approval; status is recorded as `failed` and the admin can resend.
2. **Manual** — for any `approved` request, the drawer shows a "Send confirmation email" / "Resend email" button with the current status pill (sent / failed / pending), mirroring the waitlist UI pattern.

## Technical changes

### 1. Database migration
Add to `public.investment_requests`:
- `confirmation_email_status text NOT NULL DEFAULT 'pending'`
- `confirmation_email_sent_at timestamptz`

(No new RLS/grants — existing policies on the table cover it.)

### 2. `src/lib/admin/email.server.ts`
Add `sendInvestmentConfirmationForRequestId(supabase, requestId)`:
- Reads the `investment_requests` row joined with `investors(full_name, email, phone)`.
- Builds HTML + text via a new `buildConfirmationEmail()` helper that reuses the same brand shell, colors, and FROM address as the waitlist email.
- POSTs to Resend API with `from = onboarding@mail.profiratrade.in` (env-overridable via `RESEND_FROM_ADDRESS`).
- Updates `confirmation_email_status` to `sent` (+ timestamp) or `failed`, wrapped in try/catch.

### 3. `src/lib/admin/email.functions.ts`
Add `sendInvestmentConfirmationEmail` serverFn (mirrors `sendApprovalEmail`):
- `.middleware([requireSupabaseAuth])` + `assertStaff`
- Input: `{ requestId: uuid }`
- Calls `sendInvestmentConfirmationForRequestId(context.supabase, ...)`.

### 4. `src/lib/admin/investment-requests.functions.ts`
- In `approveInvestmentRequest.handler`: after the successful RPC, best-effort call `sendInvestmentConfirmationForRequestId(context.supabase, data.id)` inside a try/catch — log on failure, return the original RPC result unchanged so the UI flow doesn't break.
- Extend `listInvestmentRequests` select to include `confirmation_email_status, confirmation_email_sent_at`.
- Extend `getInvestmentRequestDetail` (already `select *`, so it picks them up automatically — no change).

### 5. `src/components/admin/investment-review-drawer.tsx`
- Import `sendInvestmentConfirmationEmail`; wire a mutation.
- For `data.status === "approved"`: show an "Email confirmation" section with a small status pill (sent / failed / pending) plus a button labeled "Send confirmation email" (or "Resend email" when status is `sent`/`failed`), with success/error toasts. Reuse the existing `EmailPill` styling from `admin.waitlist.tsx` (copy the small component into a shared spot or inline it locally — small, no shared module needed).

## Out of scope

- Waitlist email (already working).
- Rejection emails.
- Email queue / Lovable Emails migration — sticking with the existing direct Resend integration per current setup.
- Changes to RLS, the approve RPC, document generation, or payout scheduling.
