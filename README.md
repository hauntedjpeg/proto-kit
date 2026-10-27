# proto-kit

Starter for prototypes that run as **Figma code layers** and later convert to a production
Next.js app. Vite · React · TypeScript · Tailwind v4 · stera-icons · pnpm.

```
pnpm install
pnpm dev                # local
pnpm figma:preflight    # must exit 0 before pushing / cloning into Figma
pnpm build && pnpm preview
node scripts/nextjs-migration-report.mjs .   # when the prototype is done
```

Read `AGENTS.md` — it's the rulebook for any agent (including Figma's) editing this repo.

## Layout

```
src/
  components/   pure UI, props in → JSX out (ports to Next.js unchanged)
  screens/      one per route; local state; calls src/mock/api
  mock/         typed fixtures + fake async API (deterministic)
  lib/          storage wrapper, utils
  App.tsx       route switch (replaced by app/ routes in Next.js)
.figma/make/    install / dev / deploy-preview — what Figma runs
scripts/        figma-preflight.mjs, nextjs-migration-report.mjs
```

## Figma

Figma → Code layer → Clone repository → this repo. If Figma generates its own
`.figma/make/*` files, keep whichever version works and commit them.
