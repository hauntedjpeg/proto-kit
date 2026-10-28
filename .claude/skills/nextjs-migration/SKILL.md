---
name: nextjs-migration
description: Convert this finished proto-kit prototype (Figma code layer, Vite + React) into a production Next.js App Router app; use when the prototype is approved and must become the real product.
---

# proto-kit → production Next.js

Input: this repo (made from https://github.com/hauntedjpeg/proto-kit — Vite,
`src/{components,views,mock,lib,styles}`, `App.tsx` route switch). Output: a new Next.js App Router
repo. The prototype repo is left intact so the Figma code layer keeps working during the transition.

## 0. Inventory first

```
node scripts/nextjs-migration-report.mjs .
```
It lists routes, views, components, mock API functions, files needing `'use client'`, storage
and env usage, and boundary violations. **Fix section 10 (boundary violations) in the prototype
before migrating** — a component that imports mock data has to be refactored to props either way.

Ask the user, once, for the things the prototype faked: data source(s), auth, and hosting target.
Don't invent them.

## 1. Scaffold

```
pnpm create next-app@latest <name> --ts --tailwind --app --src-dir --no-eslint --use-pnpm
pnpm add stera-icons
```
Copy over `.mise.toml`, `stera.config.json` (set `"css"` to `src/app/globals.css`) and `AGENTS.md`
(then edit `AGENTS.md`: delete the "static only", embedded-context and Figma sections, keep the
boundary, import, icon and Stera UI rules). Do **not** copy `vite.config.ts`, `index.html`,
`src/main.tsx`, `src/App.tsx`, `.figma/`, or `scripts/figma-preflight.mjs`.

create-next-app's default `@/*` → `./src/*` alias matches the prototype's, so `@/` imports copy
over unchanged.

## 2. Mapping

| Prototype | Next.js | Notes |
|---|---|---|
| `src/components/*` (incl. `ui/`) | `src/components/*` | copy unchanged; they have no framework imports |
| `src/lib/utils.ts` | `src/lib/utils.ts` | copy unchanged (`cn`); Stera UI components need it |
| `src/views/XScreen.tsx` | `src/app/<route>/x-screen.tsx` with `'use client'` | body of the page; receives `initialData` prop |
| `App.tsx` `case "x"` | `src/app/x/page.tsx` (Server Component) | fetches data, renders `<XScreen initialData={…} />` |
| `App.tsx` `default` | `src/app/page.tsx` | same |
| `onNavigate("x")` prop | `next/link` `<Link href="/x">` or `useRouter().push("/x")` | remove the prop from views |
| `src/mock/api.ts` `listX()` | server fetch in `page.tsx`, or `src/lib/data/x.ts` | reads: Server Component fetch |
| `src/mock/api.ts` `mutateX()` | Server Action in `src/app/<route>/actions.ts` | writes: `'use server'` function; call from the client body |
| `src/mock/*.ts` types | `src/lib/types.ts` | keep types, delete fixtures after data is wired |
| `src/lib/storage.ts` usage | keep for pure UI prefs; use cookies/DB for anything the server must know | decide per call site (report section 7) |
| `import.meta.env.VITE_X` | `process.env.NEXT_PUBLIC_X` (client) or `process.env.X` (server only) | |
| `src/styles/globals.css` | `src/app/globals.css` | Tailwind v4 `@theme` is identical; drop the `#root` selector |
| `src/styles/ui/*.css` | `src/app/ui/*.css` (or keep `src/styles/ui/` and fix the `@import` path) | Stera partials; port unchanged |
| `useState(seed)` + `useEffect(fetch)` | `initialData` prop from the server page | delete the seeding effect |
| `<img>` | `next/image` where size/perf matters | optional |
| `h-dvh` root layout | `src/app/layout.tsx` sets `<body className="h-dvh">` | |

## 3. Order of work

1. Copy `components/`, `lib/utils.ts` and the `styles/` CSS. `pnpm build` — must pass before
   anything else.
2. For each route: create `page.tsx` (server) + the client view body. Keep the mock API
   temporarily so every route renders; replace `onNavigate` with links.
3. Replace mock reads one function at a time with real fetches in the server pages.
4. Replace mock writes with Server Actions (or route handlers if a client/other service calls
   them).
5. Add auth, middleware/proxy, env, error/loading boundaries (`loading.tsx`, `error.tsx`).
6. Delete `src/mock/`. Move types to `src/lib/types.ts`.
7. Re-introduce server features deliberately — `connection()`, `cookies()`, `headers()`,
   `revalidate` are now allowed; the prototype avoided them only because of Figma.

## 4. Verify

- `pnpm build` passes with no `'use client'` on files that don't need it (hooks, browser globals,
  event handlers are the only reasons).
- Every prototype view reachable by URL; back/forward works.
- Grep: no `src/mock`, no `import.meta.env`, no `onNavigate`.
- Lighthouse or a quick check that first paint is server-rendered (view source shows content).

## Don't

- Don't try to keep one repo serving both Figma and production. The constraints conflict
  (static vs. server). Keep the prototype repo as the Figma artifact; the Next.js repo is the
  product. If Figma needs the newer UI, port components back — they're framework-free.
- Don't move prototype `useEffect` fetches into Next.js client components; that forfeits SSR.
  Fetch on the server, pass props.
- Don't rename or restructure `components/` during migration; do that in a later PR so the diff
  stays reviewable.
