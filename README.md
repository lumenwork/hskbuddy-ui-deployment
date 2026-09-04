# HSKBuddy web deployment

Public deployment copy of the HSKBuddy Vite + React frontend. The application files live at this repository's root and correspond to `apps/web` in the development repository.

Vercel settings: Vite preset, root `./`, install `bun install --frozen-lockfile`, build `bun run build`, output `dist`. The versioned `vercel.json` supplies these build settings and handles direct visits to React routes. The build includes TypeScript checking.

Pushes to `main` trigger production deployments through Vercel's Git integration. Other branches receive preview deployments, subject to Vercel's contributor permissions.

The development repository's GitHub Actions workflow publishes the tracked `apps/web` source here after its Web and API checks pass on `main`. It requires the `WEB_DEPLOY_TOKEN` secret in that source repository. Once configured, make frontend changes in the development repository; this repository is generated deployment output. The `.hskbuddy-source` file records the published source commit. The sync preserves this README and `.gitignore`, removes obsolete frontend files, and excludes environment files, dependencies, build output, and backend files.

The current web shell requires no environment variables and makes no API requests. `/api` is excluded from the SPA fallback. Configure a verified same-origin proxy to the Go API before shipping API-backed learner flows. `VITE_API_TARGET` only controls the local Vite development proxy.

Local checks:

```sh
bun install --frozen-lockfile
bun run typecheck
bun run build
```
