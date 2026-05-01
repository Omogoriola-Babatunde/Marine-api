# Marine API — Spec Sheet & Audit

## 1. Overview

A small Express 5 + Prisma (SQLite) service for issuing **marine cargo insurance quotes** and converting them into **policies** with a generated PDF **certificate of insurance**. PDFs are rendered from an HTML template via headless Puppeteer.

- **Entry point:** `server.js`
- **App:** `src/app.js`
- **Runtime:** Node.js (ESM, `"type": "module"`)
- **DB:** PostgreSQL via `@prisma/adapter-pg` + `pg` (Prisma 7)
- **PDF engine:** Puppeteer 24 (single shared browser instance)

## 2. Configuration

| Env var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `DATABASE_URL` | *required* | Postgres connection string (e.g. `postgresql://user:pass@host:5432/db`) |
| `CERTIFICATE_DIR` | `<cwd>/certificates` | Where generated PDFs are stored |

Loaded via `dotenv/config` in `server.js` and `prisma.config.ts`.

## 3. HTTP Surface

Base mounts:
- `GET /` — liveness, returns `"Marine API is running!"`
- `/api/quote` — quote routes
- `/api/policy` — policy routes

CORS: methods `GET, POST, PUT, DELETE`, headers `Content-Type, Authorization`, `credentials: true`, `maxAge: 3600`.
Body limit: `10kb` JSON.

### 3.1 `POST /api/quote` — create quote

**Request body**
```json
{
  "classType":   "A | B | C",
  "cargoType":   "string, ≤100 chars",
  "cargoValue":  "number > 0",
  "origin":      "string, ≤100 chars",
  "destination": "string, ≤100 chars"
}
```

**Behavior**
- Validates with `validateQuoteInput`.
- Computes premium: `cargoValue * rate`, where `rate` = `0.1` (A), `0.007` (B), `0.005` (C). Default fallback `0.005` (unreachable given validation).
- Inserts a `Quote` row.

**Responses**
- `200` → full Quote record (id, classType, cargoType, cargoValue, origin, destination, premium, createdAt)
- `400` → `{ "errors": [string] }`
- `500` → `{ "error": "Failed to create quote" }`

### 3.2 `GET /api/quote` — list quotes (paginated)

**Query**
- `page` (default `1`, min `1`)
- `limit` (default `10`, max `100`)

**Response 200**
```json
{
  "data": [Quote, ...],
  "pagination": { "page": n, "limit": n, "total": n, "pages": n }
}
```
Ordered by `createdAt desc`. Counts via `prisma.quote.count()` in parallel.

### 3.3 `POST /api/policy` — issue policy + certificate

**Request body**
```json
{ "quoteId": "string (Quote.id)", "customername": "string, ≤100 chars" }
```

**Behavior**
1. Validates input.
2. Looks up `Quote` by `id`. `404` if missing.
3. Generates `policyNumber = "POL-" + Date.now()`.
4. Inserts `Policy` row with `status: "active"`.
5. Renders certificate HTML → PDF via Puppeteer, writes `certificate-<policyNumber>.pdf` in the process CWD.
6. Returns `{ policy, certificatePath }`.

### 3.4 `GET /api/policy/certificate/:policyNumber` — download certificate

- Validates `policyNumber` matches `^POL-\d+$`.
- Resolves `<cwd>/certificate-<policyNumber>.pdf`, asserts the normalized path stays under `cwd`, then `res.download(...)`.
- `400` invalid format · `404` file missing · `403` path traversal · `500` other.

## 4. Data Model (`prisma/schema.prisma`)

```prisma
model Quote {
  id          String   @id @default(uuid())
  classType   String
  cargoType   String
  cargoValue  Float
  origin      String
  destination String
  premium     Float
  createdAt   DateTime @default(now())
}

model Policy {
  id           String   @id @default(uuid())
  policyNumber String   @unique
  Quoteid      String          // NOT a relation; stores quote id
  customername String
  status       String
  createdAt    DateTime @default(now())
}
```

Migrations: single init migration at `prisma/migrations/20260429172441_init/`.

## 5. Module Map

| File | Role |
|---|---|
| `server.js` | Boot, signal handlers, graceful shutdown (closes browser + Prisma) |
| `src/app.js` | Express app, CORS, JSON body, route mounting |
| `src/config/db.js` | Singleton `PrismaClient` w/ better-sqlite3 adapter |
| `src/utils/browserPool.js` | Singleton Puppeteer browser (`launch` once, reused) |
| `src/utils/validation.js` | `validateQuoteInput`, `validatePolicyInput`, `escapeHtml` |
| `src/Routes/quoteRoutes.js` | `POST /`, `GET /` |
| `src/Routes/policyRoutes.js` | `POST /`, `GET /certificate/:policyNumber` |
| `src/Controllers/quoteController.js` | `createQuotes`, `getQuotes` |
| `src/Controllers/policyController.js` | `createPolicy`, `downloadCertificate` |
| `src/Services/quotesServices.js` | `calculatePremium(classType, cargoValue)` |
| `src/Services/certificateService.js` | HTML → PDF cert via Puppeteer |

## 6. Lifecycle

- Boot: `server.js` imports `app`, listens on `PORT`. Browser & Prisma lazy-init on first request.
- Shutdown: `SIGTERM`/`SIGINT` → `server.close()` → `closeBrowserPool()` → `disconnectPrisma()` → `exit(0)`.

---

## 7. Audit Findings

### 7.1 Blocker bugs (server cannot start as written)

1. **`src/Controllers/quoteController.js:1` — broken import.**
   ```js
   import pkg from @prisma/client;";
   ```
   Missing opening quote, stray characters. This file fails to parse, so `quoteRoutes` cannot load, so the app crashes on import.
2. **`src/Controllers/quoteController.js:5` — `getPrismaClient` is never imported** but called as `const prisma = getPrismaClient();`. Even after fixing #1, this throws `ReferenceError`. Add `import { getPrismaClient } from "../config/db.js";`.
3. **`src/Controllers/quoteController.js:6` — dead code.** `const { PrismaClient } = pkg;` is unused after switching to the shared client. Remove it (and the broken `pkg` import).

### 7.2 Correctness bugs

4. **`src/Services/certificateService.js:14-15` — mismatched HTML tags.**
   ```html
   <h2 ...>Certificate of Insurance</h1>
   <h3 ...>Marine Cargo Insurance</h2>
   ```
   `<h2>…</h1>` and `<h3>…</h2>` are malformed. Renders, but invalid HTML.
5. **`src/Controllers/policyController.js:26` — non-unique `policyNumber` source.**
   `"POL-" + Date.now()` collides under concurrent requests within the same millisecond. The `policyNumber` column is `@unique`, so the second request returns `500` from a Prisma uniqueness violation (instead of a clean error). Use `crypto.randomUUID()` or a counter.
6. **`src/utils/validation.js:32-34` — claims to validate UUID, doesn't.** Error message says "must be a valid UUID" but the check only verifies it's a non-empty string. Either drop the UUID claim or actually validate format.
7. **`src/utils/validation.js:14` — `!data.cargoValue` rejects `0`, but the explicit `<= 0` check below would catch it anyway.** Functionally OK; just redundant. More importantly, this rejects `0` correctly but also rejects negative-but-truthy `NaN` only because `typeof NaN === "number"`, so `NaN` slips past the type check and is caught by `<= 0` (NaN comparisons are false → fails the type+sign combo). Tighten with `Number.isFinite(data.cargoValue) && data.cargoValue > 0`.
8. **`src/Services/certificateService.js:36-37` — relative path coupling.** Cert is written as `certificate-${policyNumber}.pdf` (relative), then read by `policyController` from `process.cwd()`. Works only if CWD never changes between write and read. Use `path.join(CERTIFICATE_DIR, …)` symmetrically on both sides.
9. **No FK relation on `Policy.Quoteid`.** Schema stores quote id as a plain string — no referential integrity, no cascade behavior, no `@relation`. Switch to `quote Quote @relation(fields: [quoteId], references: [id])` and rename to `quoteId` (lowercase) for Prisma convention.

### 7.3 Security & robustness

10. **No auth.** All endpoints are public. Any caller can list every quote or issue a policy on any quote. Add at least an API-key middleware before exposing this beyond localhost.
11. **No rate limiting / abuse control.** PDF generation is expensive (Puppeteer page per request); a single client can pin CPU and exhaust file descriptors. Add `express-rate-limit` and/or a queue.
12. **PDFs land in CWD with no cleanup.** Disk grows unbounded. Either stream the PDF directly to the response (skip the file write) or write to a managed temp/storage dir with retention.
13. **`escapeHtml` assumes string input.** If `policy.policyNumber`, `policy.customername`, etc. are ever non-string, `.replace` throws. Coerce: `String(text).replace(...)`.
14. **`downloadCertificate` path-traversal guard is partial.** The regex on `policyNumber` already constrains input to `POL-\d+`, so the `startsWith(CERTIFICATE_DIR)` check is belt-and-suspenders. Fine to keep, but ensure `CERTIFICATE_DIR` ends without a trailing separator before comparison, or compare via `path.relative(CERTIFICATE_DIR, normalizedPath)` and reject if it begins with `..`.
15. **CORS default is `http://localhost:3000`.** When `ALLOWED_ORIGINS` is unset in production, the API will silently allow only localhost — preferable to wildcard, but worth making this fail loudly in prod.
16. **No central error handler.** Each controller does `try/catch → res.status(500)`. A missed `await` becomes an unhandled rejection. Add an Express error middleware and an `unhandledRejection` log.
17. **No request logging / observability.** No morgan/pino, no request IDs, no metrics. Errors only reach `console.error`.

### 7.4 Repo hygiene

18. **`tmp-prisma-debug.mjs` and `tmp-prisma-inspect.mjs`** are committed at the project root. Looks like leftover debugging scaffolding.
19. **PDFs at repo root** (`downloaded-certificate.pdf`, `secure-cert.pdf`, `test-certificate.pdf`) — `.gitignore` excludes `*.pdf` going forward, but these are already tracked. Remove with `git rm`.
20. **No tests.** Zero coverage. Even smoke tests for the two POST endpoints would catch the import bug in §7.1.
21. **No `dev` script / no nodemon.** Only `start` and `postinstall`.
22. **Prisma 7 is leading-edge.** Confirm intentional; many adapter packages and tooling examples still target v5/v6.

### 7.5 Performance

23. **"Browser pool" is a single browser, not a pool.** Every request opens a new `page`, but they all share one `browser`. Under load, page creation serializes inside Chromium. If volume matters, use `puppeteer-cluster` or pre-warm a pool of N browsers.
24. **Schema lacks indexes** on `Policy.Quoteid` (will full-scan on quote→policy lookups) and on `Quote.createdAt` (used as the list `orderBy`).

---

## 8. Recommended Priority Fixes

1. Fix `quoteController.js` import & client wiring (§7.1) — without this nothing works.
2. Replace `Date.now()` policyNumber with a UUID/ULID (§7.2 #5).
3. Add real UUID validation or update the error string (§7.2 #6).
4. Fix mismatched `<h1>/<h2>/<h3>` tags in the cert template (§7.2 #4).
5. Use `path.join(CERTIFICATE_DIR, …)` consistently in cert write + read (§7.2 #8).
6. Add auth + rate limit before any external exposure (§7.3 #10–11).
7. Add an FK relation between `Policy` and `Quote`, plus indexes (§7.2 #9, §7.5 #24).
8. Clean up `tmp-prisma-*.mjs` and committed PDFs (§7.4 #18–19).
