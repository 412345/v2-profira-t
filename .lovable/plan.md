# Customer Support Modal — Revised Plan

Add a unified, lightweight Customer Support popup triggered from two places, with no changes to routing, schemas, or backend.

## New component

`src/components/customer-support-modal.tsx`
- Controlled dialog: props `{ open: boolean; onOpenChange: (v: boolean) => void }`.
- Built on existing shadcn `Dialog` (already in project), centered, `max-w-[420px]`, `rounded-2xl`, dark surface using PROFIRA tokens (`#14151A` surface, `#D61F3A` accent, white text, `#B8B8B8` secondary).
- Header: uppercase `CUSTOMER SUPPORT`, tracked, semibold, thin accent rule below.
- Body — two rows, full-width cards (`rounded-xl`, `border border-white/[0.06]`, hover lift):
  1. **WhatsApp** — `MessageCircle` (lucide) in green-tinted badge; label "WhatsApp / Telegram" + phone `+91 90062 82854`. Anchor: `https://wa.me/919006282854?text=Hi%20PROFIRA%20Support` with `target="_blank"` + `rel="noopener noreferrer"`.
  2. **Instagram** — `Instagram` (lucide) in pink→orange gradient badge; label "Instagram" + sublabel "DM us for any support". Anchor: `https://www.instagram.com/profiratrade?igsh=bjhreXBleXR2anhn`, same safe target.
- Footer: centered `We resolve any issues within a few hours.` in `#B8B8B8`, small caps tracking, divider above.
- Dialog primitives handle X / ESC / overlay-click close.

## Trigger placements

### 1. `src/routes/index.tsx` (public homepage)
- Add `useState` `supportOpen`.
- Remove the existing block:
  ```tsx
  <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/50">
    <Lock className="h-3 w-3" strokeWidth={1.75} />
    Applications reviewed within 24 hours
  </p>
  ```
- Replace with a subtle `button` matching the same `text-[11px] text-white/50 hover:text-white/80 underline-offset-4 hover:underline` reading `Contact Us`, that calls `setSupportOpen(true)`. Drop the now-unused `Lock` import.
- Render `<CustomerSupportModal open={supportOpen} onOpenChange={setSupportOpen} />` once inside the root container.

### 2. `src/components/auth-pill.tsx` (the "Dashboard" pill in the authenticated header)
This is the actual target node — the `LayoutDashboard` + "Dashboard" pill rendered by `AuthPill` (used on the portfolio/header). Per the corrected instruction:
- Keep the pill's exact layout, sizing, border, background, hover states, and gap relative to the sign-out button — only swap its semantics.
- Convert the `Link` to a `button type="button"` (so it opens a modal instead of navigating). All other classNames preserved verbatim.
- Replace icon import `LayoutDashboard` → `Headphones` from lucide-react; keep `h-3 w-3` sizing.
- Label text "Dashboard" → "Contact Us".
- Add local `useState` `supportOpen` inside `AuthPill`; `onClick={() => setSupportOpen(true)}`.
- Render `<CustomerSupportModal open={supportOpen} onOpenChange={setSupportOpen} />` next to the returned fragment.
- Remove now-dead `dashboardTo` / `role` / `getMyRole` usage **only if** nothing else needs them; otherwise leave the role-fetch effect intact and just stop using `dashboardTo`. Safer choice: leave the role hook intact (no behavior change), simply unused for the pill's `to=` — minimizes risk to auth state logic.
- Sign-out button untouched. Signed-out branch (`Sign in` link) untouched. Circular User avatar in `portfolio.tsx` Header untouched.

Note on scope: `AuthPill` is the shared component that renders this pill wherever it appears in authenticated headers; the visible change therefore consistently applies wherever the same pill is shown.

## Safety / scope guarantees

- Only files edited:
  - `src/routes/index.tsx`
  - `src/components/auth-pill.tsx`
  - `src/components/customer-support-modal.tsx` (new)
- `src/routes/_authenticated/portfolio.tsx` is **not** modified.
- No route files added, no `routeTree.gen.ts` touched, no server functions, no schema/migration/RLS changes, no env/secrets, no new dependencies.
- All external links use `target="_blank" rel="noopener noreferrer"`.
- State is purely local `useState`.

## Out of scope

- Profile avatar, sign-out button, admin pages, emails, auth flows, analytics.
