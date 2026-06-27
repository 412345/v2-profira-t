# Phase 4 — Flow Fixes & Polish

Targeted bug fixes only. No schema changes, no new routes.

## 1. Auth flow

**`src/routes/signin.tsx`**
- After `supabase.auth.signUp` succeeds, do NOT call `routeByRole`. Instead: toast "Account created — please sign in", switch the tab to `signin`, prefill the email field, clear password. (Handles both auto-confirm-on and email-confirm flows uniformly.)
- After `signInWithPassword` succeeds, route investors straight to `/portfolio` (the dashboard) instead of `/home`. Admin/staff still go to `/admin`. Investors with no role still land on `/portfolio` (the `_authenticated` gate + `get_or_create_my_investor` RPC takes care of the shell row).
- Add a "Join the waitlist" link below the Sign-in tab form as well (currently only under signup), so unapproved users have a clear path.

## 2. Auth pill — explicit Sign Out

**`src/components/auth-pill.tsx`**
- When logged in, render TWO pills side-by-side instead of a single dropdown:
  - "Dashboard" (links to `/portfolio`, or `/admin` for staff)
  - "Sign out" (red outline, calls `supabase.auth.signOut()` then navigates to `/`)
- Keeps the simple "Sign in" pill for logged-out users.

## 3. Home page "Start Investing" CTAs

**`src/routes/home.tsx`**
- Both CTA buttons ("Start Investing" hero + "Become Investor" footer) currently do nothing. Convert both to a single `handleStartInvesting` that:
  - Reads session via `supabase.auth.getSession()` on click (cheap, cached).
  - If no session → `navigate({ to: "/signin" })`.
  - If session present → `navigate({ to: "/onboarding" })` (the wizard already starts at KYC; if KYC is complete the user can skip to the amount/payment step — see step 5 below).

## 4. Onboarding — skip completed steps & prefill from waitlist

**`src/lib/investor/portfolio.functions.ts`** (extend)
- After fetching the investor row, also look up the most recent matching `waitlist` row by `email` and return `waitlistName: string | null` on the summary.

**`src/lib/investor/kyc.functions.ts`** (new server fn `getOnboardingBootstrap`)
- Returns `{ investor, waitlistName, kycComplete }` so the wizard can:
  - Prefill `full_name` / `phone` from waitlist if investor fields are empty.
  - If `kyc_completed === true`, start the wizard at **step 2 (amount)** instead of step 0.

**`src/routes/_authenticated/onboarding.tsx`**
- Replace the `Aryan Reshav` placeholder with the waitlist name (or empty string if none).
- Use the bootstrap query above to set initial `state.full_name`, `state.phone`, and starting `state.step`.

## 5. Portfolio greeting — show waitlist name when profile is empty

**`src/routes/_authenticated/portfolio.tsx`**
- Greeting `name` resolution order: `investor.full_name` → `waitlistName` (from summary) → email local-part → "Investor".
- The completion banner stays as-is (40% complete) but now sits below the real user's name.

## 6. Company bank details

Update the values shown on the payment step to the real PROFIRA collection account.

**`.env`** (and **`.env.example`**)
```
VITE_COMPANY_BANK_NAME="Bandhan Bank"
VITE_COMPANY_ACCOUNT_NUMBER="20100077095972"
VITE_COMPANY_IFSC_CODE="BDBL0001088"
VITE_COMPANY_ACCOUNT_HOLDER="M/S SOY ENGINEERING WORKS"
```
Also add a new `VITE_COMPANY_BRANCH="Ranchi"` and surface "Branch: Ranchi" as a new row in the bank-details card inside `StepTerms` in `onboarding.tsx`.

Note: these are `VITE_*` (publishable), so they must be set in Vercel's Environment Variables for the production deployment to pick them up — `.env` only covers local dev.

## 7. Perceived performance

Small, safe wins only:
- Add `defaultPreload: "intent"` and `defaultPreloadStaleTime: 0` in `src/router.tsx` so links prefetch on hover/touch.
- In `src/routes/__root.tsx`, drop the heavy `<Atmosphere />` backdrop on `/signin` and `/portfolio` (already disabled on `/admin`) — it animates and dominates main-thread on low-end devices.
- `home.tsx`: gate the `<HeroCandleBackdrop />` and the long candle chart behind `prefers-reduced-motion`-aware lighter renders is out of scope; instead just lower `candleCount` for `1M` from 24 to 18 (already small) — skip if no measurable win.

## 8. Vercel deployment sanity

No config changes needed. After these edits:
- `bun run build` must pass with zero TS errors.
- No new server functions are called from public-route loaders (all new auth-gated reads are invoked from components via `useServerFn` + `useQuery`), so `build:dev` prerender stays green.

## Files touched

- edit `src/routes/signin.tsx`
- edit `src/components/auth-pill.tsx`
- edit `src/routes/home.tsx`
- edit `src/routes/__root.tsx`
- edit `src/router.tsx`
- edit `src/lib/investor/portfolio.functions.ts`
- edit `src/lib/investor/kyc.functions.ts`
- edit `src/routes/_authenticated/onboarding.tsx`
- edit `src/routes/_authenticated/portfolio.tsx`
- edit `.env`, `.env.example`

No DB migration. No new packages. Email sending stays untouched per your instruction.
