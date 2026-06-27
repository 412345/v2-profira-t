## Cause of the Vercel failure

The deploy log shows nitro auto-detected Vercel and used the `nitro:vercel` preset (`Using nodejs24.x runtime`, output written to `.vercel/output/static/...`). That means the SSR/server bundle is emitted to `.vercel/output/`, **not** to `dist/server/server.js`.

But `vercel.json` runs:

```
bun run build:static  →  vite build  &&  node scripts/prerender.mjs
```

`scripts/prerender.mjs` then tries to `import('dist/server/server.js')` and exits with:

```
[prerender] missing dist/server/server.js. Did the SSR build run?
```

…which is the `exit 1` Vercel reports.

The `build:static` + manual prerender flow is meant for a plain static host. When deploying to Vercel you want nitro's Vercel preset to do everything (SSR functions + static assets via the Vercel Build Output API). Mixing the two breaks the build.

## Fix

Change `vercel.json` so Vercel just runs the normal nitro/Vercel build and lets nitro write directly to `.vercel/output` (Vercel auto-detects that — no `outputDirectory` needed).

### New `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "bun run build",
  "framework": null
}
```

(Removes `buildCommand: build:static`, removes `outputDirectory: dist/client`, removes `cleanUrls`/`trailingSlash` which only apply to static hosting and are irrelevant once nitro handles routing.)

No other code changes are required. `scripts/prerender.mjs` and the `build:static` npm script stay in the repo for users who want a fully static export elsewhere — they're just no longer used on Vercel.

## Steps for you to deploy

1. I apply the `vercel.json` change above (after you approve this plan / switch to build mode).
2. Push to the branch connected to Vercel (or click **Redeploy** on the failed deployment).
3. On Vercel project settings, leave Framework Preset as **Other**; do **not** override Build Command, Output Directory, or Install Command — `vercel.json` controls them.
4. Add any required env vars in Vercel → Settings → Environment Variables (at minimum the Supabase ones from `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, plus any server-side secrets your server functions read via `process.env`).
5. Trigger the deploy. Nitro's Vercel preset will emit `.vercel/output/` and Vercel will serve SSR + static assets from it.

## Notes

- Lovable's own "Publish" button is unaffected and remains the easiest path if you don't need Vercel specifically.
- If you later want a true static export (no SSR), that's a different change — several routes (`_authenticated/*`, server functions) can't be prerendered, so going fully static would require removing/guarding them first.
