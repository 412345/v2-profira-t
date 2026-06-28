# Plan — Replace Terms Blurb with Full User Agreement

## Scope
Single file change: `src/routes/_authenticated/onboarding.tsx`, `StepTerms` component.

Only the small placeholder paragraph inside the scroll box (currently ~3 lines starting "Investment Terms & Conditions") is replaced. No changes to checkboxes, payment flow, bank details panel, transaction ID input, submit logic, or step navigation.

## Changes

1. **Extract agreement to a constant** at the top of the file:
   - `const USER_AGREEMENT = \`...\`` containing the exact wording supplied by the user (verbatim, no paraphrasing, no markdown reformatting that alters words).

2. **Render the agreement** inside the existing scroll container in `StepTerms`:
   - Keep the existing wrapper `<div class="... overflow-y-auto rounded-xl border ...">` but:
     - Increase max height from `max-h-40` to `max-h-72` so users can comfortably scroll a long document without dominating the viewport.
     - Render content as `<pre class="whitespace-pre-wrap font-sans text-xs leading-relaxed">{USER_AGREEMENT}</pre>` to preserve line breaks and indentation from the source text while staying on the sans body font.
     - Headings (`USER AGREEMENT & TERMS OF SERVICE`, numbered sections) remain as plain text inside the `<pre>` — no parsing required.
   - Keep the surrounding border, padding, background, and secondary text color tokens unchanged so it matches the existing visual language.

3. **No other changes**:
   - Checkboxes (`agree1/2/3`), bank panel, transaction ID, "I have completed the payment", Back/Done buttons, validation, and mutation call all stay exactly as they are.
   - No new dependencies, no schema changes, no route changes.

## Why this preserves the flow
- The container is already scroll-isolated (`overflow-y-auto`), so a long document does not push the rest of the step off-screen.
- Step shell layout, progress dots, and submit gating logic are untouched, so payment submission still requires all three checkboxes + transaction ID + paid confirmation.

## Out of scope
- No email sending changes.
- No copy edits to the agreement text — inserted verbatim.
- No admin-side changes.
