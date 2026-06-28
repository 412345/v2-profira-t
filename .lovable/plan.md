## Goal

Replace the existing waitlist approval email flow with a branded Resend send. Admin clicks Approve (or Send/Retry), the backend builds a polished HTML email using the row's Name/Email/Phone, sends it via Resend from `Profira Trade <onboarding@mail.profiratrade.in>`, updates the waitlist row's email status, and surfaces success/error toasts.

## Files to change

- `src/lib/admin/email.server.ts` — rewrite to:
  - Stop reading the DB `email_templates` row; render the new HTML in-code.
  - Use the hardcoded sender `Profira Trade <onboarding@mail.profiratrade.in>` (overridable by `RESEND_FROM_ADDRESS` env).
  - Build the CTA URL `https://www.profiratrade.in/signup?email=<urlencoded recipient>`.
  - Keep the existing try/catch + waitlist `resend_email_status` / `resend_email_sent_at` updates (already wired to the admin toast logic).

- `src/routes/signup.tsx` *(new)* — tiny TanStack route that reads `?email=` and redirects to `/signin` in signup mode with the email prefilled (keeps existing auth flow intact, satisfies the email link).

- `src/routes/signin.tsx` — on mount, read `email` + `mode=signup` from the URL and set the email field + active tab so the prefill works.

## Email design

- Width-constrained (600px) card, white background `#FFFFFF`, charcoal text `#0F1014`, Profira red accent `#D61F3A`, subtle border `#E6E7EB`.
- Header: "PROFIRA TRADE" wordmark in red, tagline "Private Investment Desk".
- Greeting: "Welcome aboard, {Name}." + approval confirmation paragraph.
- "Your registered profile" panel listing Name / Email / Phone for confirmation.
- Step list (1. Click below 2. Set a secure password 3. Sign in 4. Deploy capital).
- Centered solid red button "CREATE ACCOUNT" linking to the signup URL with prefilled email; plain-text fallback link underneath.
- Footer: support contact + small legal line.
- Plain-text alternative body included so deliverability stays high.

## Behavior

- No new env vars required; `RESEND_API_KEY` already exists. From-address default is the verified `onboarding@mail.profiratrade.in`.
- Approve action (`setWaitlistStatus` → `approved`) already calls `sendApprovalEmailForWaitlistId`; the admin UI already shows success/failure toasts and a Retry button on failure. No UI changes needed beyond the prefill route.
- All Resend calls remain wrapped in try/catch; failures mark `resend_email_status = 'failed'` and bubble a descriptive error to the admin toast without breaking the table.

## Out of scope

- No schema migrations, no changes to `email_templates` table (left untouched for back-compat).
- No changes to auth providers, KYC, or other admin tabs.
