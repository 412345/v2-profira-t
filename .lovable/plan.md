
Four focused fixes. No DB schema changes, no new dependencies, no email work, no Vercel config changes.

## 1. Admin → Investor detail shows full portfolio

File: `src/lib/admin/investors.functions.ts` — extend `getInvestor` to also return:
- `requests`: all rows from `investment_requests` for this investor (id, amount, status, reference_number, transaction_id, created_at, approved_at, notes)
- `payouts`: all rows from `payouts` for this investor (id, amount, month, status)
- `totals`: `{ totalInvested, pendingAmount, rejectedAmount, monthlyReturn, maturityTotal, lifetimePayouts }` computed from the rows above using the same formulas as the investor portfolio (monthly = principal × 0.10, maturity = principal × 1.60).

File: `src/routes/_authenticated/admin.investors.$id.tsx` — add three new sections under the existing Profile/Documents grid:
- **Portfolio summary cards**: Total Invested, Pending Verification, Monthly Payout, Maturity Total (using `KpiCard`).
- **Investment Requests table**: ref number, transaction id, amount, status badge, created date. Each pending row gets inline Approve / Reject buttons wired to `approveInvestmentRequest` / `rejectInvestmentRequest` (already in `investment-requests.functions.ts`). Success → invalidate `["admin","investor",id]`, `["admin","investments"]`, `["admin","stats"]`.
- **Payouts table**: month, amount, status. Empty state when none.

## 2. New payers appear instantly in the Investors panel

The `investors` row already exists via `get_or_create_my_investor`, but `listInvestors` doesn't surface the most useful signal (the new payment request). Two minimal changes:

File: `src/lib/admin/investors.functions.ts` — augment `listInvestors` to left-join aggregate counts via a second query: fetch `investment_requests` grouped by investor_id (id, amount, status, created_at) and attach `pending_requests_count`, `pending_amount`, `last_request_at` to each investor row. Order results by `GREATEST(last_request_at, created_at) DESC` so anyone who just submitted a payment floats to the top.

File: `src/routes/_authenticated/admin.investors.tsx`:
- Add a "Pending payment" status chip (amber, pulsing) next to the status badge when `pending_requests_count > 0`.
- Add a new filter option "Awaiting verification" that filters to `pending_requests_count > 0`.
- Reduce `useQuery` `staleTime` to 0 and add `refetchOnWindowFocus: true` so returning to the tab refreshes.

## 3. Dashboard "Total Funds Managed" reflects real money under management

File: `src/lib/admin/dashboard.functions.ts` — replace the `funds.aum` sum with the real figure:
`totalAum = SUM(amount) FROM investment_requests WHERE status='approved'`
(this is already loaded as `reqApprovedRes`). Keep the existing `funds` query only if needed elsewhere; otherwise drop it. The KPI card on `admin.index.tsx` keeps its label "Total Funds Managed" — only the data source changes.

## 4. Polished sign-in / sign-up screen

File: `src/routes/signin.tsx` — keep all auth logic and routing untouched. Visual upgrade only:
- Split-pane layout on `md+`: left panel is a brand showcase (PROFIRA wordmark, tagline, subtle animated gradient mesh using pure CSS — no new deps, GPU-light, respects `prefers-reduced-motion`); right panel hosts the existing card.
- Card refinements: layered translucent surface (`bg-[#0B0C10]/80 backdrop-blur-xl`), 1px crimson top hairline, soft inner glow, refined tab styling with crimson active indicator.
- Field upgrades: floating label feel via consistent spacing, focus ring in `#D61F3A`, `lucide` icons inside inputs (`Mail`, `Lock`, `User`).
- Trust strip below the card: three muted micro-badges ("SEBI-aware", "Bank-grade encryption", "Approved access only").
- Mobile (<md): single column, brand block collapses into a compact header — same components, no separate file.

All styling via Tailwind utilities already in the project. No new packages. No font swap. Component remains client-only (`ssr: false`) as today, so Vercel SSR/prerender is unaffected.

## Verification

- `bun run build` clean.
- Manual flow: log in as admin → dashboard shows real AUM → Investors list shows freshly-paid investor at top with amber pending chip → open detail → see requests table → click Approve → status flips, investor `amount` increments, agreement document generated (existing RPC handles all of this).
