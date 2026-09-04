# HSKBuddy web deployment

Public deployment copy of the HSKBuddy Vite + React frontend. The application files live at this repository's root and correspond to `apps/web` in the development repository.

Vercel settings: Vite preset, root `./`, install `bun install --frozen-lockfile`, build `bun run build`, output `dist`. The versioned `vercel.json` supplies these build settings and handles direct visits to React routes. The build includes TypeScript checking.

Pushes to `main` trigger production deployments through Vercel's Git integration. Other branches receive preview deployments, subject to Vercel's contributor permissions. This repository is not automatically synchronized with the development repository: publish frontend source changes here to deploy them. Include `bun.lock` and `vercel.json`; exclude `node_modules`, `dist`, environment files, and backend files.

The current web shell requires no environment variables and makes no API requests. `/api` is excluded from the SPA fallback. Configure a verified same-origin proxy to the Go API before shipping API-backed learner flows. `VITE_API_TARGET` only controls the local Vite development proxy.

Local checks:

```sh
bun install --frozen-lockfile
bun run typecheck
bun run build
```
