# Marine Frontend

Next.js 16 frontend for the Marine Cargo Insurance API. Two pages:

- `/` — quote form
- `/quotes/[id]` — quote details, policy issuance, and inline PDF cert preview

## Stack

Next.js 16 (App Router) · TypeScript · TanStack Query v5 (sessionStorage-persisted) · shadcn/ui · react-hook-form + zod · react-pdf · biome · pnpm.

## Architecture

The browser only ever talks to the same-origin Next.js Route Handlers under `/api/*`. Each handler proxies to the backend at `process.env.API_URL` (server-only). No CORS, no public env vars, no backend URL leaked to the client.

The quote that's just been created lives in TanStack Query's cache (`['quote', id]`) with `sessionStorage` persistence — refresh-within-tab works; sharing the URL across tabs/devices does not. The PDF certificate is the durable shareable artifact.

See `../docs/superpowers/specs/2026-05-02-marine-frontend-design.md` for the full design.

## Local development

```bash
pnpm install                                  # also runs the pdf.js worker copy script
echo "API_URL=http://localhost:4000" > .env.local
pnpm dev                                       # frontend on :3000
```

In another terminal, run the backend:
```bash
cd ../marine-api
PORT=4000 pnpm start
```

To target Railway prod instead:
```bash
echo "API_URL=https://marine-api-production.up.railway.app" > .env.local
pnpm dev
```

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server on :3000 |
| `pnpm build && pnpm start` | Production build + serve |
| `pnpm lint` | biome check |
| `pnpm format` | biome format --write |
| `pnpm test` | Vitest unit tests (zod schemas + Route Handlers) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm e2e` | Playwright happy-path E2E (msw-mocked backend) |

## Deployment (Vercel)

Set `API_URL` in the project's environment variables to the live backend URL. No other config required — Route Handlers run on Vercel's Node runtime by default.

## Design constraints

- **No gradients.** Solid surfaces only. Use shadcn's CSS-variable color tokens (`bg-background`, `text-foreground`, `border`, `text-muted-foreground`) instead of hard-coded hex values.
- **Dark + light, default = system.** Powered by `next-themes`. Both modes must look correct; do not assume a single theme.
- **Geist font.** Loaded via `next/font/google` and exposed as `--font-sans` / `--font-mono` for Tailwind.
