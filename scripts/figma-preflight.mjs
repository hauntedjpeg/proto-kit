#!/usr/bin/env node
// figma-preflight.mjs — checks a prototype repo for things that break Figma code layers.
// Figma's deploy-preview needs a static build; its dev script needs a server on $PORT.
//
// Usage:  node scripts/figma-preflight.mjs [repoDir] [--build]
//   --build   also runs `build` and verifies dist/index.html (Vite) or out/index.html (Next).
// Exit 0 = ready. Exit 1 = blockers (✗). Warnings (⚠) never fail.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const doBuild = args.includes("--build");
const root = args.find((a) => !a.startsWith("--")) ?? process.cwd();

const blockers = [], warnings = [], ok = [];
const SKIP = new Set(["node_modules", ".next", "out", "dist", "build", ".git", ".figma", "coverage", "scripts"]);
const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const rel = (p) => relative(root, p);
const strip = (s) => s.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.has(extname(name))) yield p;
  }
}

// ---------- package.json ----------
const pkgPath = join(root, "package.json");
if (!existsSync(pkgPath)) { console.error(`No package.json in ${root}`); process.exit(1); }
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const scripts = pkg.scripts ?? {};
const isNext = "next" in deps, isVite = "vite" in deps;

if (!scripts.build) blockers.push("package.json: no `build` script (Figma requires one).");
if (!scripts.dev && !scripts.start) blockers.push("package.json: no `dev`/`start` script (Figma needs an entry point).");
if (!pkg.packageManager) warnings.push('package.json: add "packageManager": "pnpm@<version>" so Figma installs with pnpm.');
if (!["pnpm-lock.yaml", "package-lock.json", "yarn.lock"].some((f) => existsSync(join(root, f))))
  warnings.push("No lockfile committed — Figma may resolve different versions than local.");
if (!existsSync(join(root, ".mise.toml"))) warnings.push("No .mise.toml — pin node + pnpm so Figma's runtime matches yours.");
if (existsSync(join(root, "pnpm-workspace.yaml"))) warnings.push("Monorepo — Figma clones the whole repo (<3GB); prefer one app per repo.");
if (!existsSync(join(root, "AGENTS.md")) && !existsSync(join(root, "CLAUDE.md")))
  warnings.push("No AGENTS.md — Figma's agent won't know the repo rules. Copy it from the template.");

for (const [name, spec] of Object.entries(deps))
  if (/^(file:|link:|workspace:|git\+|github:|https?:)/.test(String(spec)))
    blockers.push(`dependency \`${name}\` = ${spec} — Figma installs public npm packages only.`);
if (existsSync(join(root, ".npmrc"))) {
  const rc = readFileSync(join(root, ".npmrc"), "utf8");
  if (/_authToken/.test(rc) || (/registry=/.test(rc) && !/registry\.npmjs\.org/.test(rc)))
    warnings.push(".npmrc references a private registry/token — unsupported in Figma.");
}

// dev script / port
const devScript = scripts["dev:figma"] ?? scripts.dev ?? scripts.start ?? "";
const viteCfgFile = ["vite.config.ts", "vite.config.mts", "vite.config.js", "vite.config.mjs"].map((f) => join(root, f)).find(existsSync);
const viteCfg = viteCfgFile ? strip(readFileSync(viteCfgFile, "utf8")) : "";
const portOk = /\$\{?PORT|--port|-p\b/.test(devScript) || /process\.env\.PORT/.test(viteCfg);
if (!portOk) warnings.push("Dev server doesn't read $PORT — Figma's .figma/make/dev must bind it (add `dev:figma` or read process.env.PORT in vite.config).");

// ---------- Vite ----------
if (isVite) {
  ok.push(`Vite ${deps.vite}`);
  if (!existsSync(join(root, "index.html"))) blockers.push("Vite: no index.html at repo root.");
  if (/\bbase\s*:\s*['"`]\/[^'"`]+['"`]/.test(viteCfg)) warnings.push("vite.config: non-root `base` — use './' so assets resolve inside Figma's preview.");
  else if (!/\bbase\s*:\s*['"`]\.\/['"`]/.test(viteCfg)) warnings.push("vite.config: set `base: './'` for relative asset URLs.");
  if (/\boutDir\s*:\s*['"`](?!dist)/.test(viteCfg)) warnings.push("vite.config: outDir is not `dist` — Figma's deploy-preview script must match.");
  if (/vite-plugin-ssr|vike|@vitejs\/plugin-ssr|ssr\s*:/.test(viteCfg)) blockers.push("vite.config: SSR configured — code layers need a static build.");
  if ("react-router" in deps || "react-router-dom" in deps)
    warnings.push("react-router present — use HashRouter or MemoryRouter; BrowserRouter needs server rewrites a static host doesn't have.");
}

// ---------- Next.js (for retrofitting old prototypes) ----------
if (isNext) {
  ok.push(`Next.js ${deps.next}`);
  warnings.push("This is a Next.js repo. The prototype target is Vite; if you keep Next, it must be a static export.");
  const cfgFile = ["next.config.ts", "next.config.mjs", "next.config.js"].map((f) => join(root, f)).find(existsSync);
  const cfg = cfgFile ? strip(readFileSync(cfgFile, "utf8")) : "";
  if (!/output\s*:\s*['"`]export['"`]/.test(cfg))
    blockers.push("next.config: missing `output: 'export'` — `next build` emits a server, so Figma has no static artifact.");
  else {
    ok.push("next.config: output: 'export'");
    if (!/unoptimized\s*:\s*true/.test(cfg) && !/loader\s*:/.test(cfg)) warnings.push("next.config: set `images: { unoptimized: true }`.");
  }
  if (/\b(basePath|assetPrefix)\s*:/.test(cfg)) warnings.push("next.config: remove basePath/assetPrefix for Figma.");
  for (const f of ["middleware.ts", "middleware.js", "src/middleware.ts", "proxy.ts", "src/proxy.ts"])
    if (existsSync(join(root, f))) blockers.push(`${f}: middleware/proxy doesn't run in a static export.`);
}

// ---------- source scan ----------
for (const file of walk(root)) {
  const raw = readFileSync(file, "utf8"), s = strip(raw), r = rel(file);
  if (isNext) {
    if (/^\s*['"]use server['"]/m.test(raw)) blockers.push(`${r}: 'use server' — Server Actions unsupported in static export.`);
    if (/from\s+['"]next\/server['"]/.test(s) && /\bconnection\s*\(/.test(s))
      blockers.push(`${r}: connection() forces per-request rendering → no static artifact. Move the logic into a 'use client' component.`);
    if (/from\s+['"]next\/headers['"]/.test(s)) blockers.push(`${r}: next/headers (cookies/headers/draftMode) needs a request.`);
    if (/dynamic\s*=\s*['"]force-dynamic['"]/.test(s)) blockers.push(`${r}: dynamic='force-dynamic' is incompatible with static export.`);
    if (/unstable_noStore|\bnoStore\(\)/.test(s)) blockers.push(`${r}: noStore() opts out of static rendering.`);
    if (/\/route\.(t|j)s$/.test(file) && (!/dynamic\s*=\s*['"]force-static['"]/.test(s) || /export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)/.test(s)))
      blockers.push(`${r}: route handler — only GET + dynamic='force-static' survives static export.`);
    if (/\/pages\/api\//.test(file)) blockers.push(`${r}: pages/api route — no API routes in static export.`);
    if (/getServerSideProps/.test(s)) blockers.push(`${r}: getServerSideProps unsupported in static export.`);
    if (/page\.(t|j)sx?$/.test(file) && /\[[^\]]+\]/.test(r) && !/generateStaticParams/.test(s))
      blockers.push(`${r}: dynamic segment without generateStaticParams().`);
    if (/next\/font\/google/.test(s)) warnings.push(`${r}: next/font/google fetches at build time — prefer next/font/local.`);
  }
  // both stacks
  if (/process\.env\.(?!NODE_ENV\b)(?!NEXT_PUBLIC_)(?!VITE_)(?!PORT\b)[A-Z0-9_]+/.test(s) && !/\.config\./.test(r))
    warnings.push(`${r}: reads a non-public env var — Figma injects none; inline a default.`);
  if (/\bwindow\.(top|parent)\b/.test(s)) warnings.push(`${r}: window.top/parent — the layer is embedded; cross-frame access throws.`);
  if (/target=["']_top["']/.test(s)) warnings.push(`${r}: target="_top" navigation breaks inside the canvas.`);
  if (/\b(localStorage|sessionStorage)\./.test(s) && !/lib\/storage/.test(r) && !/try\s*\{/.test(s))
    warnings.push(`${r}: direct web storage use — go through src/lib/storage.ts (try/catch).`);
  if (/\/mock\//.test(r) && /^(export\s+)?(const|let)\s+\w+\s*=\s*[^;]*(Date\.now\(\)|Math\.random\(\)|new Date\(\))/m.test(s))
    warnings.push(`${r}: non-deterministic value at module scope in mock data — use fixed strings so previews are stable.`);
  if (/\/components\//.test(r) && /from\s+['"][^'"]*\/mock\/(?!.*\btype\b)/.test(s) && !/import\s+type/.test(s))
    warnings.push(`${r}: component imports mock data (not just types) — components should take data via props.`);
  if (/\/components\//.test(r) && /from\s+['"](next\/|react-router)/.test(s))
    warnings.push(`${r}: component imports a router/framework module — keep components framework-free.`);
}

// ---------- build ----------
if (doBuild) {
  const pm = existsSync(join(root, "pnpm-lock.yaml")) ? "pnpm" : "npm";
  console.log(`\n▶ ${pm} run build`);
  const res = spawnSync(pm, ["run", "build"], { cwd: root, stdio: "inherit", shell: true });
  if (res.status !== 0) blockers.push("`build` failed — Figma's deploy-preview will fail identically.");
  else {
    const outDir = isNext ? "out" : "dist";
    if (existsSync(join(root, outDir, "index.html"))) ok.push(`static artifact: ${outDir}/index.html`);
    else blockers.push(`build ok but ${outDir}/index.html missing — nothing static for Figma to serve.`);
  }
}

// ---------- report ----------
const u = (a) => [...new Set(a)];
console.log(`\nFigma code-layer preflight — ${root}\n`);
u(ok).forEach((m) => console.log(`  ✓ ${m}`));
u(warnings).forEach((m) => console.log(`  ⚠ ${m}`));
u(blockers).forEach((m) => console.log(`  ✗ ${m}`));
console.log(`\n${u(blockers).length ? `${u(blockers).length} blocker(s)` : "No blockers"} · ${u(warnings).length} warning(s)\n`);
process.exit(u(blockers).length ? 1 : 0);
