# PROFIRA Investor Onboarding + KYC + Investment Flow

Adds onboarding wizard, real portfolio data, and admin-reviewable investment requests. Keeps existing routes and `vercel.json` untouched.

## Database migration

ALTER `public.investors` (all nullable for backward compat):
- `aadhaar_name text`, `gov_id_type text` (check in `aadhaar|pan|passport|driving_license`), `gov_id_number text`, `bank_name text`, `account_holder_name text`, `kyc_completed boolean NOT NULL DEFAULT false`, `kyc_completed_at timestamptz`, `user_id uuid REFERENCES auth.users` (so an investor row can be owned by a logged-in user)

CREATE `public.investment_requests`:
- `id`, `investor_id` FK, `amount numeric(14,2)`, `transaction_id text`, `status text DEFAULT 'pending'` (validated via trigger, not CHECK), `payment_method text DEFAULT 'bank_transfer'`, `reference_number text UNIQUE` (auto-gen `PROF-XXXXXX`), `approved_by uuid REFERENCES auth.users`, `approved_at timestamptz`, `notes text`, timestamps
- Trigger generates reference number on insert
- RLS: investor reads own (`investor_id IN (SELECT id FROM investors WHERE user_id = auth.uid())`); staff reads/updates all via `is_staff(auth.uid())`
- GRANTs to `authenticated` + `service_role`

CREATE `public.kyc_documents`:
- `id`, `investor_id` FK, `doc_type text`, `file_url text`, `status text DEFAULT 'pending'`, `created_at`
- Same RLS shape (own + staff); GRANTs

Helper RPC `public.get_or_create_my_investor()` (SECURITY DEFINER): returns the investor row for `auth.uid()`, creating a shell row from `profiles`/email if missing. Used by the wizard so KYC writes always target one row.

## Server functions

`src/lib/investor/portfolio.functions.ts` (auth, runs as the user):
- `getMyInvestorSummary()` — returns `{ investor, kycComplete, totalInvested, monthlyReturn, payouts[], requests[] }`. Sums approved `investment_requests.amount` for total invested; pulls `payouts` joined by investor_id for the sparkline.
- `getMyInvestmentRequests()` — returns this user's requests with status + reference_number.

`src/lib/investor/kyc.functions.ts`:
- `saveKycDetails({ ...kycFields })` — validates with zod, calls `get_or_create_my_investor` RPC to get the investor id, updates investor fields, sets `kyc_completed=true`, `kyc_completed_at=now()`.
- `createInvestmentRequest({ amount, transactionId })` — requires `kyc_completed`; validates `amount >= 10000`, `transactionId` alphanumeric 10-22; inserts row; returns `{ ok, requestId, referenceNumber }`.

Enhance existing:
- `src/lib/admin/investors.functions.ts` `listInvestors` + `getInvestor` — include KYC fields and aggregated request counts.
- New admin fn `listInvestmentRequests({ status })` and `setInvestmentRequestStatus({ id, status, notes? })` (approve/reject), with cascading effect: on `approved`, set the investor's status to `active` if not already.

All KYC server fns gate on auth via `requireSupabaseAuth`. No anon paths.

Schemas centralized in `src/lib/investor/schemas.ts`:
- Phone: strip non-digits, accept 10 Indian digits
- IFSC: `[A-Z]{4}0[A-Z0-9]{6}` auto-upper
- Aadhaar: 12 digits; PAN: `[A-Z]{5}[0-9]{4}[A-Z]`; Passport: alphanumeric 6-12; DL: alphanumeric 8-20
- Bank account: 6-18 digits
- Investment amount: integer `>= 10000`, `<= 50_000_000`
- Transaction id: alphanumeric 10-22

## UI

`/onboarding` (under `_authenticated/onboarding.tsx`):
- 5-step wizard using local state + zod-resolved react-hook-form per step.
- Progress dots header: crimson active, green check completed, gray future. Mobile-friendly stepper.
- Each step is its own component file under `src/components/onboarding/`: `step-personal.tsx`, `step-bank.tsx`, `step-amount.tsx`, `step-terms.tsx`, `step-confirmation.tsx`. Wizard manages navigation + persisted state in `useReducer`.
- Step 3 amount cards (₹10K / ₹50K / ₹1L / ₹5L) + custom input with en-IN formatter. Real-time calc: monthly = amount * 0.10; 6-month maturity = amount * (1.10)^6 (~1.7716 ×); shows principal + returns + total.
- Step 4 reveals company bank card only after all three checkboxes ticked. Bank values come from `import.meta.env.VITE_COMPANY_*` (publishable) so they can render client-side. Copy buttons use `navigator.clipboard`. Submits via `useMutation` calling `createInvestmentRequest`.
- Step 5 shows animated check (CSS keyframes), reference number from mutation response, CTA back to `/portfolio`.
- Shake animation via Tailwind utility (`@keyframes shake` added to `src/styles.css`).
- Loading spinners via lucide `Loader2` on submit buttons.

`/portfolio` (rewrite of `_authenticated/portfolio.tsx`):
- Loader uses `ensureQueryData(['portfolio'])` calling `getMyInvestorSummary`. Adds `errorComponent` + `notFoundComponent`.
- Uses `useSuspenseQuery` in the page component.
- 40% banner shown when `!kycComplete` (linking to `/onboarding`). Otherwise shows real total / change / sparkline / payout list.
- Empty state when no requests: "No active investments" + Start Investing CTA → `/onboarding`.
- Market Watch widget keeps existing static data (or pulls from `src/lib/market-data.ts`) — out of scope to wire to a real feed; left as visual.
- Quick Actions: Download Agreement / Invoice link to existing `admin.documents.$id.tsx` rendering, scoped to the investor's own documents. Invest More → `/onboarding` (skips to amount step if KYC done). Withdraw → toast "Coming soon" (no backend feature requested).
- Performance timeframe toggle filters the SVG sparkline from real `payouts` rows by month.

Admin:
- Add `/_authenticated/admin/investment-requests.tsx` listing pending/approved/rejected with approve/reject buttons, calling the new admin fns. Linked from admin nav.
- Tiny "KYC" badge column on `admin.investors.tsx`.

## Vercel hygiene

- Append `VITE_COMPANY_BANK_NAME`, `VITE_COMPANY_ACCOUNT_NUMBER`, `VITE_COMPANY_IFSC_CODE`, `VITE_COMPANY_ACCOUNT_HOLDER` to `.env.example` (publishable — they're shown to the investor anyway).
- No new dependencies. `vercel.json`, `vite.config.ts`, auto-gen files untouched.
- All new server fns are `.functions.ts`; all UI is `.tsx`.
- Each wizard step + portfolio route gets `errorComponent` + skeleton loading.

## What I will NOT change

- Landing `/`, `/home`, `/signin`, waitlist dialog, existing admin routes, RLS on existing tables, auth flow, Supabase auto-gen files, vercel.json, vite.config.ts.

## Order of operations after approval

1. Single migration (investor columns + 2 tables + RPC + trigger + RLS + GRANTs).
2. Schemas + 4 new server-fn files; enhance admin investors fn.
3. Onboarding wizard route + 5 step components + shake keyframe in styles.
4. Portfolio rewrite to real data.
5. Admin investment-requests page + investors KYC badge.
6. Update `.env.example`.
7. `bun run build` smoke test.

## Open question

Investor → user linkage: the spec says "investor lands on Portfolio" right after signup, but the existing `investors` table has no `user_id`. I'm adding one and the `get_or_create_my_investor` RPC so newly signed-in approved users automatically get a shell investor row to fill in. If you'd prefer a different linkage (e.g. matching by `auth.users.email = investors.email`), say so and I'll swap to that — otherwise I proceed with the user_id column.