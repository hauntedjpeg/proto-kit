# Agent rules for this prototype

This repo is a **Figma code-layer prototype**. It is cloned into Figma, where Figma's agent
edits it and Figma builds it. Every rule below exists so the build stays static and the
later conversion to a production Next.js app stays mechanical. Follow them whether you are
Claude, Figma's agent, or anything else.

## Non-negotiable

- **Static only.** `pnpm build` must emit `dist/index.html`. No server, no API routes, no SSR,
  no env secrets. If a feature needs a server, fake it in `src/mock/`.
- **Dev server listens on `$PORT`** (`vite.config.ts` already does; don't hardcode a port).
- **Public npm only.** No private registries, git deps, or `file:` deps.
- **Don't change framework.** Vite + React + TypeScript + Tailwind v4 + stera-icons. Do not add
  Next.js, Remix, or a backend to this repo.
- **Run `pnpm figma:preflight` before finishing** any change. ✗ must be fixed.

## Folder boundary (keeps conversion cheap)

| Folder | Contains | Rules |
|---|---|---|
| `src/components/` | pure presentational components | props in, JSX out; no fetching, no routing, no `src/mock` imports except types |
| `src/screens/` | one component per route/screen | owns local state; may call `src/mock/api`; receives navigation via `onNavigate` prop |
| `src/mock/` | typed fixtures + fake async API | deterministic, synchronous data; `setTimeout` for latency; **no `Date.now()`/`Math.random()` at module scope** |
| `src/lib/` | framework-free utilities | `storage.ts` wrapper is mandatory for web storage |
| `src/styles/` | `globals.css` (Tailwind entry + `@theme` tokens) and Stera's `ui/` partials | ports to `app/globals.css` unchanged |
| `src/App.tsx` | the switch between screens | thin; this file is deleted in the Next.js conversion |

## Imports

Use the `@/` alias for anything under `src/` (`import { Button } from "@/components/ui/button"`).
It is defined in `tsconfig.app.json` (`paths`, no `baseUrl` — TypeScript 7 removed it) and
resolved by `resolve.tsconfigPaths` in `vite.config.ts`. Relative imports are fine within a folder.

## Embedded-context rules

- Never touch `window.top` / `window.parent`; never `target="_top"`.
- Web storage only through `src/lib/storage.ts` (it try/catches).
- First paint must render from seeded data — never blank-until-fetch.
- Layout against the container (`h-dvh`, flex, container queries), not `100vw`.
- Fonts: system stack or self-hosted in `public/`; no runtime font CDN dependency.
- No external requests needing auth or CORS exceptions.

## Icons

`import { BellIcon, BellBoldIcon, BellDuotoneIcon } from "stera-icons"` — named imports only
(tree-shakeable). Weights: `Regular` (default, no suffix), `Bold`, `Fill`; `Duotone` variants exist.
Size with Tailwind (`className="size-5"`).

## Design tokens

Tailwind v4 `@theme` block in `src/styles/globals.css`. Add tokens there, not as arbitrary values
in components, so they port to `app/globals.css` later.

## Stera UI components

Components come from the Stera UI registry, not from scratch:

```
pnpm dlx stera-ui@latest init          # once per prototype; writes stera.config.json + src/styles/ui/
pnpm dlx stera-ui@latest add button    # copies src/components/ui/button.tsx (+ src/lib/utils.ts)
```

Installed files are yours to edit. Keep `src/components/ui/` for registry components and
`src/components/` for the prototype's own presentational components.
