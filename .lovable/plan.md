## Admin deletion workflows (waitlist + investors)

### 1. `src/lib/admin/waitlist.functions.ts`
Add `deleteWaitlistEntry`:
- `createServerFn({ method: "POST" })` + `.middleware([requireSupabaseAuth])` + `assertStaff`
- Input: `z.object({ id: z.string().uuid() })`
- `context.supabase.from("waitlist").delete().eq("id", data.id)`; throw on error; return `{ ok: true }`

### 2. `src/routes/_authenticated/admin.waitlist.tsx`
- Import `AlertDialog` (+ Trigger/Content/Header/Title/Description/Footer/Action/Cancel) from `@/components/ui/alert-dialog`, `Trash2` icon, and `deleteWaitlistEntry`
- Add `deleteMut` using `useMutation` → on success: toast "Waitlist entry deleted." and invalidate `["admin","waitlist"]` + `["admin","stats"]`
- Track `confirmDeleteId` local state
- Extend `RowActions` with a red ghost `Trash2` button that sets the pending id
- Render a single `<AlertDialog open={!!confirmDeleteId} onOpenChange={…}>` with the exact copy: *"Are you sure you want to delete this waitlist entry? This action cannot be undone."* Confirm button (destructive red `bg-[#D61F3A]`) calls `deleteMut.mutate(confirmDeleteId)`

### 3. `src/lib/admin/investors.functions.ts`
Add `deleteInvestorAccount`:
- `createServerFn({ method: "POST" })` + `requireSupabaseAuth` + `assertStaff`
- Input: `z.object({ id: z.string().uuid() })`
- Explicitly cascade in order using `context.supabase`: delete from `payouts`, `documents`, `kyc_documents`, `investment_requests` where `investor_id = data.id`, then delete the `investors` row. Collect any error and throw to surface FK conflicts.
- Return `{ ok: true }`

### 4. `src/routes/_authenticated/admin.investors.tsx`
- Import `AlertDialog`, `Trash2`, `deleteInvestorAccount`, `useMutation`, `useQueryClient`, `toast`
- Add a `Delete Record` action column / button per row (desktop table + mobile card). Style with red outline (`border-[#D61F3A]/40 text-[#ff8a98]`) so it's visually distinct from the existing Reject status flow.
- `stopPropagation` so it doesn't trigger row navigation
- `AlertDialog` confirmation referencing the investor's name; destructive confirm calls `deleteInvestorAccount`
- On success: toast, invalidate `["admin","investors"]`, `["admin","stats"]`, `["admin","investor", id]`

### 5. Dashboard KPI freshness — `src/lib/admin/dashboard.functions.ts` + `admin.index.tsx`
- Audit confirms metrics already aggregate live from `investment_requests`, `investors`, `payouts`, `waitlist` (no mocks). No formula change needed.
- In `admin.index.tsx`, add `refetchOnWindowFocus: true` and `staleTime: 0` to the `["admin","stats"]` query so post-deletion invalidations always trigger a refetch.
- Deletion mutations above already invalidate `["admin","stats"]`, so KPIs (Total Capital Deployed, Active Investors, Pending Applications/Waitlist) refresh instantly.

### Safety
- Both new server fns: `requireSupabaseAuth` + `assertStaff` (matches existing pattern in `waitlist.functions.ts` / `investors.functions.ts`).
- No schema/RLS/migration changes.
- No edits to generated files (`routeTree.gen.ts`, supabase integration files).
- Hard deletes only; soft-status flows (approve/reject) untouched.

### Files touched
- `src/lib/admin/waitlist.functions.ts`
- `src/lib/admin/investors.functions.ts`
- `src/routes/_authenticated/admin.waitlist.tsx`
- `src/routes/_authenticated/admin.investors.tsx`
- `src/routes/_authenticated/admin.index.tsx`
