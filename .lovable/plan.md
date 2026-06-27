Change list — two files only, no design, auth, routing, or structural changes.

1. `src/routes/index.tsx` — Landing page hero copy
   - Headline: replace "Trade Securely,\nGet Maximum Profit" with "100% SECURED &\nGUARANTEED PROFIT.\nINVEST NOW."
   - Subheading: replace "Access professionally managed market strategies through a simple investment." with "Start investing from ₹10,000 with professionally managed forex and gold investment strategies designed for consistent monthly returns."
   - Meta title/og:title: update to "PROFIRA — 100% Secured & Guaranteed Profit"
   - No styling, layout, button, card, glow, or waitlist changes.

2. `src/routes/home.tsx` — Home page hero copy + calculator + metric
   - Hero headline: replace "TRADE NOW FOR\nMAXIMUM SECURITY &\nMAXIMUM RETURNS." with "START WITH ₹10,000 &\nGET 60% RETURNS\nIN 6 MONTHS." (last line stays red-highlighted).
   - Hero supporting text: replace with "Access professionally managed forex and gold investment strategies with transparent monthly reporting and dedicated investor support."
   - Strategy performance metric: change "+7.0%" to "+10.0%".
   - Returns calculator:
     - Default state `amount`: `100000` → `10000`
     - Slider `min`: `50000` → `10000`
     - Slider `max`: `5000000` (unchanged)
     - Monthly return formula: `amount * 0.07` → `amount * 0.10`
     - Label text under cards: "(7% per month)" → "(10% per month)" (both cards)
     - Slider range labels: "₹50,000" → "₹10,000" (right label "₹50,00,000" unchanged)
   - No changes to: glass card styling, slider styling, animations, charts, feature chips, trust cards, reviews, CTAs, header, footer, navigation, auth, waitlist, admin, Supabase, Vercel, or any other component.

Verification: confirm `routeTree.gen.ts` and build compile cleanly after edits. All other files remain untouched.