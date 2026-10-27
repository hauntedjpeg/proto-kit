#!/usr/bin/env node
// nextjs-migration-report.mjs — inventories a Vite prototype (built with the figma-prototype
// conventions) and prints the work list for converting it to a production Next.js app.
//
// Usage:  node scripts/nextjs-migration-report.mjs [repoDir]
// Read-only. Exit 0 always.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

const root = process.argv[2] ?? process.cwd();
const src = join(root, "src");
const EXT = new Set([".ts", ".tsx"]);
const rel = (p) => relative(root, p);

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.has(extname(n))) yield p;
  }
}

const screens = [], components = [], mocks = [], libs = [];
const clientHooks = [], storageUses = [], envUses = [], browserGlobals = [], mockImports = [], boundaryViolations = [];

for (const f of walk(src)) {
  const r = rel(f), s = readFileSync(f, "utf8");
  if (r.includes("/screens/")) screens.push(r);
  else if (r.includes("/components/")) components.push(r);
  else if (r.includes("/mock/")) mocks.push(r);
  else if (r.includes("/lib/")) libs.push(r);

  if (/\buse(State|Effect|Ref|Reducer|LayoutEffect|Memo|Callback|Transition|Id)\b/.test(s) && !r.includes("/mock/")) clientHooks.push(r);
  if (/lib\/storage|localStorage|sessionStorage/.test(s) && !r.endsWith("lib/storage.ts")) storageUses.push(r);
  for (const m of s.matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g)) envUses.push(`${r}: ${m[1]}`);
  if (/\b(window|document|navigator)\./.test(s) && !r.includes("/lib/")) browserGlobals.push(r);
  for (const m of s.matchAll(/from\s+['"][^'"]*\/mock\/([\w-]+)['"]/g)) mockImports.push(`${r} → mock/${m[1]}`);
  if (r.includes("/components/") && /from\s+['"][^'"]*\/mock\/[^'"]+['"]/.test(s) && !/import\s+type/.test(s))
    boundaryViolations.push(`${r} imports mock data (components should take props)`);
}

const appTsx = join(src, "App.tsx");
const appSrc = existsSync(appTsx) ? readFileSync(appTsx, "utf8") : "";
const routeType = appSrc.match(/type\s+Route\s*=\s*([^;]+);/);
const routes = routeType
  ? [...routeType[1].matchAll(/["']([\w-]+)["']/g)].map((m) => m[1])
  : [...appSrc.matchAll(/case\s+["'](\w[\w-]*)["']/g)].map((m) => m[1]);

const mockApiFile = join(src, "mock", "api.ts");
const apiFns = existsSync(mockApiFile) ? [...readFileSync(mockApiFile, "utf8").matchAll(/export\s+async\s+function\s+(\w+)/g)].map((m) => m[1]) : [];

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const deps = Object.keys(pkg.dependencies ?? {});
const viteOnly = deps.filter((d) => /vite|@vitejs/.test(d));
const keep = deps.filter((d) => !viteOnly.includes(d));

const sec = (t, items, fmt = (x) => x) => {
  console.log(`\n${t}`);
  if (!items.length) console.log("  (none)");
  items.forEach((i) => console.log(`  - ${fmt(i)}`));
};

console.log(`Next.js migration report — ${root}`);
sec("1. Routes to create (app/<route>/page.tsx) — from src/App.tsx switch:", routes.length ? routes : ["(no switch found; one route: /)"]);
sec("2. Screens → 'use client' bodies under app/<route>/ (receive initial data via props):", screens);
sec("3. Components → copy unchanged to components/ (verify no framework imports):", components);
sec("4. Mock API functions → each becomes a server fetch / Server Action / route handler:", apiFns);
sec("5. Mock fixtures → delete after real data is wired; keep the exported types:", mocks);
sec("6. Files needing 'use client' (use hooks or browser globals):", [...new Set([...clientHooks, ...browserGlobals])]);
sec("7. Storage usage → decide: keep client-side, or move to cookies/DB:", storageUses);
sec("8. Env vars: VITE_* → NEXT_PUBLIC_* (or server-only without prefix):", envUses);
sec("9. Mock imports to replace (each line is one edit):", mockImports);
sec("10. Boundary violations to fix BEFORE migrating:", boundaryViolations);
sec("11. Dependencies: drop", viteOnly);
sec("    Dependencies: keep", keep);
console.log(`\nAlso: move src/index.css @theme → app/globals.css; replace <img> with next/image where it matters;\nreplace onNavigate props with next/link or useRouter; delete src/App.tsx, src/main.tsx, index.html, vite.config.ts, .figma/.\n`);
