# Phase 3 — Administrative Ledger Control Panel

Skipping email sending (per instruction). Building the back-office investment review workflow, audit trail, and document payload generation on top of the existing `investment_requests` / `documents` / `investors` schema.

## 1. Database migration

Single migration adding:

- `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_payload JSONB NOT NULL DEFAULT '{}'::jsonb;` (column already loosely exists as `payload jsonb`; will add `document_payload` only if missing, otherwise no-op — verified via existing schema before writing).
- `public.admin_audit_logs` table exactly as specified, plus:
  - `GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;`
  - `GRANT ALL ON public.admin_audit_logs TO service_role;`
  - RLS enabled; policy: staff-only SELECT/INSERT via `public.is_staff(auth.uid())`.
  - Index on `(targeted_subsystem_category, associated_record_reference_key)` and `(created_at desc)`.
- Helper RPC `public.approve_investment_request(_id uuid, _notes text)` (SECURITY DEFINER, staff-gated) that, in one transaction:
  1. Loads the request + investor.
  2. Marks request `approved`, sets `approved_by`, `approved_at`, `notes`.
  3. Bumps `investors.amount` and flips status to `active`.
  4. Inserts an `agreement` row into `documents` with computed `document_payload` (principal, monthly payout = P × 0.10, maturity = P + P × 0.10 × 6, tenure 6, investor snapshot, bank snapshot, reference number, generated_at).
  5. Inserts a corresponding `admin_audit_logs` row (`executed_action_descriptor='approve_investment'`, `targeted_subsystem_category='investment_requests'`).
- Companion RPC `public.reject_investment_request(_id uuid, _notes text)` — marks rejected + writes audit log.

## 2. Server functions (`src/lib/admin/`)

- `audit.functions.ts` → `listAuditLogs({ category?, limit })` for staff.
- Extend `investment-requests.functions.ts`:
  - Replace the inline `setInvestmentRequestStatus` approve/reject body with calls to the new RPCs so the document + audit log are written atomically.
  - Add `getInvestmentRequestDetail(id)` returning the request joined with full investor row (KYC, bank, contact) for the drawer.
- Extend `dashboard.functions.ts` to also return:
  - `pendingInvestmentRequests` (count) and `pendingInvestmentVolume` (sum of `amount` where status='pending').

## 3. Admin UI

### a. Metrics hub (`/_authenticated/admin`)
- Add two KPI cards: "Pending Verification Requests" (amber dot when > 0) and "Capital Volume Under Review" (₹ sum). Keep existing growth/payouts charts; switch fund-growth series to a real cumulative sum derived from approved `investment_requests.created_at` (replace the synthesized curve).

### b. Investments board (`/_authenticated/admin/investments`)
- New route file (mirrors the existing `admin.investment-requests.tsx` but renamed/aliased to `/admin/investments` per spec; keep old path as redirect to avoid breaking nav).
- Search input (name/email/UTR) + status filter dropdown (All / Pending / Approved / Rejected) using URL search params via `validateSearch`.
- Responsive table columns: Investor, Email, Amount, UTR (`transaction_id`), Status pill (amber/emerald/red, `rounded-full`), Created (IST), Actions ("Review" opens drawer).
- Mobile: card layout fallback via `useMediaQuery` (same pattern as `admin.investors.tsx`).
- Add the new route to `admin-nav.tsx`.

### c. Inspection drawer (shadcn `Sheet`, `side="right"`, `max-w-[600px]`, bg `#14151A`, border `#1F2024`)
Sections:
1. **Investor profile** — full name, phone, email, `gov_id_type`, masked `gov_id_number` (show last 4 only), `aadhaar_name`.
2. **Banking** — `bank_name`, `ifsc`, masked `bank_account` (last 4), `account_holder_name`.
3. **Allocation & yield** — Principal, Monthly payout (`P × 0.10`), Maturity total (`P + P × 0.10 × 6`), 6-month tenure, UTR.
4. **Admin actions** — `notes` textarea, "Approve & Generate Documents" (`bg-[#D61F3A] hover:bg-[#B8172F]`, calls approve RPC via server fn, toasts success with generated reference, invalidates queries, closes drawer), "Reject Transaction Intake" (outlined red, calls reject).
- All mutations via `useMutation` + `useServerFn`, loading spinners, error toast.

## 4. File touch list

```text
supabase/migrations/<ts>_phase3_admin_ledger.sql   (new)
src/lib/admin/audit.functions.ts                   (new)
src/lib/admin/investment-requests.functions.ts     (edit: RPC calls + detail fn)
src/lib/admin/dashboard.functions.ts               (edit: new KPIs + real growth)
src/components/admin/admin-nav.tsx                 (edit: add /admin/investments)
src/components/admin/investment-review-drawer.tsx  (new)
src/routes/_authenticated/admin.investments.tsx    (new — primary board)
src/routes/_authenticated/admin.investment-requests.tsx (edit: thin redirect or keep as alias)
src/routes/_authenticated/admin.index.tsx          (edit: 2 new KPIs)
```

No changes to `vite.config.ts`, `vercel.json`, auth, or existing public routes. No new npm deps. Email sending intentionally out of scope.

## 5. Verification

- `bun run build` clean.
- Manual loop: open `/admin/investments` → filter pending → open drawer → approve → confirm `documents` row + `admin_audit_logs` row + investor flipped to active + amount bumped + reference number visible.
