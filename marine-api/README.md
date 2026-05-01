# Marine API

Express 5 + Prisma 7 (PostgreSQL) service for issuing **marine cargo insurance quotes** and turning them into **policies** with a generated PDF **certificate of insurance**. PDFs are rendered from an HTML template via headless Puppeteer.

> Demo / flow build. Auth, rate limiting, request logging, and tests are intentionally out of scope right now and will be added later.

## Stack

- Node.js (ESM, `--watch`) ≥ 18.11
- Express 5
- Prisma 7 with `@prisma/adapter-pg` + `pg`
- PostgreSQL
- Puppeteer 24 for HTML → PDF
- helmet for security headers
- Biome 2 for lint + format

## Prerequisites

- Node ≥ 18.11
- pnpm ≥ 10 (`corepack enable` or `npm i -g pnpm`)
- A reachable PostgreSQL instance
- Chrome download for Puppeteer (auto-installed via pnpm; ~150 MB)

## Setup

```bash
git clone https://github.com/Omogoriola-Babatunde/Marine-api.git
cd Marine-api/marine-api
pnpm install
cp .env.example .env
# edit .env and set DATABASE_URL
pnpm exec prisma migrate deploy
```

`pnpm install` automatically runs Prisma's `generate` (postinstall) and Puppeteer's Chrome install — no separate steps needed.

## Run

```bash
pnpm dev      # node --watch, restarts on save
pnpm start    # plain node
```

Server listens on `http://localhost:3000` by default.

### Where to poke around

| What | URL |
|---|---|
| Swagger UI (try the API in the browser) | http://localhost:3000/api/docs |
| OpenAPI 3 spec (JSON) | http://localhost:3000/api/docs.json |
| Liveness check | http://localhost:3000/ |

## Environment

Only `DATABASE_URL` is required.

| Var | Default | Notes |
|---|---|---|
| `DATABASE_URL` | *required* | e.g. `postgresql://postgres:postgres@localhost:5432/marine_api` |
| `PORT` | `3000` | HTTP port |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS allowlist |
| `CERTIFICATE_DIR` | `<cwd>/certificates` | Where generated PDFs are written |
| `NODE_ENV` | unset | Set to `production` to enable prod-only checks |

## API

Base URL: `http://localhost:3000`. Interactive docs at [`/api/docs`](http://localhost:3000/api/docs).

### `POST /api/quote`

Create a quote and compute its premium.

```json
{
  "classType": "A | B | C",
  "cargoType": "string ≤ 100",
  "cargoValue": 50000,
  "origin": "Lagos",
  "destination": "Hamburg"
}
```

Premium rates: `A → 10%`, `B → 0.7%`, `C → 0.5%`. Returns the full Quote with `id`, `premium`, `createdAt`.

### `GET /api/quote?page=1&limit=10`

Paginated list of quotes (newest first). `limit` capped at 100.

```json
{
  "data": [ /* Quote[] */ ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
}
```

### `POST /api/policy`

Issue a policy from an existing quote and generate its certificate PDF.

```json
{ "Quoteid": "<UUID of an existing Quote>", "customername": "Acme Co" }
```

Returns:

```json
{
  "policy": { "id": "...", "policyNumber": "POL-<uuid>", "quoteId": "...", "customername": "...", "status": "active", "createdAt": "..." },
  "certificatePath": "/abs/path/to/certificates/certificate-POL-<uuid>.pdf"
}
```

### `GET /api/policy/certificate/:policyNumber`

Downloads the generated PDF. `policyNumber` must match `POL-<uuid v4>`. Path traversal is rejected with `403`.

## Data model

```
Quote (id, classType, cargoType, cargoValue, origin, destination, premium, createdAt)
  └── Policy[]   (id, policyNumber UNIQUE, quoteId FK, customername, status, createdAt)
```

Indexes on `Quote.createdAt` and `Policy.quoteId`.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Start with `node --watch` |
| `pnpm start` | Plain `node server.js` |
| `pnpm lint` | `biome lint .` |
| `pnpm format` | `biome format --write .` |
| `pnpm check` | `biome check --write .` (lint + format + import sort) |

## Project layout

```
marine-api/
├── prisma/
│   ├── schema.prisma                  # Postgres schema with FK + indexes
│   └── migrations/
├── src/
│   ├── app.js                         # Express app, CORS, helmet, error middleware
│   ├── config/
│   │   ├── db.js                      # Prisma client (PrismaPg adapter)
│   │   └── paths.js                   # CERTIFICATE_DIR
│   ├── Controllers/
│   │   ├── quoteController.js
│   │   └── policyController.js
│   ├── Routes/
│   ├── Services/
│   │   ├── quotesServices.js          # premium calculation
│   │   └── certificateService.js      # HTML → PDF
│   └── utils/
│       ├── browserPool.js             # singleton Puppeteer browser
│       └── validation.js
├── server.js                          # boot + signal handlers
└── biome.json
```

## Security notes

- helmet sets standard security headers; `x-powered-by` disabled.
- CORS is an explicit allowlist via callback (not just `origin: []`).
- Body size capped at `10kb`.
- All HTML-bound values in the certificate run through `escapeHtml`.
- `policyNumber` uses `crypto.randomUUID()` (no `Date.now()` collisions).
- Certificate download uses `path.relative` + `..`/absolute check on top of a UUID-format regex.
- `unhandledRejection` and `uncaughtException` are logged.

## Known gaps (deferred)

- No auth — endpoints are public.
- No rate limiting — Puppeteer is CPU/mem heavy, easy to abuse.
- No structured request logging or metrics.
- No test suite.
- Single Puppeteer browser shared across requests; pages serialize through it.
- Generated PDFs are not cleaned up.

## Audit

The full backend audit + spec sheet is in [`SPEC.md`](./SPEC.md).
