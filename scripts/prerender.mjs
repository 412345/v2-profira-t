// Post-build prerender for static hosts (e.g. Vercel).
//
// The TanStack Start build emits a Node-compatible SSR entry at
// `dist/server/server.js` and the client bundle/CSS at `dist/client/assets/*`.
// This script imports the SSR entry, fetches each configured route, and writes
// the rendered HTML into `dist/client/` so a static host can serve them.
//
// Only runs in the user's own CI (Vercel). Lovable's own build is unaffected
// because Lovable runs `bun run build` directly — not `build:static`.

import { writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROUTES = ["/", "/home", "/about", "/portfolio"];
const ROOT = resolve(process.cwd());
const CLIENT_DIR = join(ROOT, "dist", "client");
const SERVER_ENTRY = join(ROOT, "dist", "server", "server.js");
const BASE_URL = "http://localhost";

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(SERVER_ENTRY))) {
    console.error(`[prerender] missing ${SERVER_ENTRY}. Did the SSR build run?`);
    process.exit(1);
  }

  const mod = await import(pathToFileURL(SERVER_ENTRY).href);
  const handler = mod.default ?? mod;
  if (typeof handler?.fetch !== "function") {
    console.error("[prerender] SSR entry has no `fetch` export.");
    process.exit(1);
  }

  for (const route of ROUTES) {
    const request = new Request(`${BASE_URL}${route}`, { method: "GET" });
    let response;
    try {
      response = await handler.fetch(request, {}, {});
    } catch (err) {
      console.error(`[prerender] ✗ ${route} threw:`, err);
      process.exit(1);
    }
    if (!response || response.status >= 400) {
      console.error(`[prerender] ✗ ${route} → ${response?.status}`);
      process.exit(1);
    }
    const html = await response.text();
    const outPath =
      route === "/"
        ? join(CLIENT_DIR, "index.html")
        : join(CLIENT_DIR, route.replace(/^\//, ""), "index.html");
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html, "utf8");
    console.log(`[prerender] ✓ ${route} → ${outPath.replace(ROOT + "/", "")} (${html.length} bytes)`);
  }
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
