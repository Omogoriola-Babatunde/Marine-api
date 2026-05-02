# Marine Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Next.js 15 frontend at `marine-frontend/` that exercises the Marine API's quote → policy → certificate flow end-to-end, with TanStack Query (sessionStorage-persisted), shadcn/ui, react-hook-form + zod for forms, and react-pdf for inline cert preview.

**Architecture:** Two pages (`/`, `/quotes/[id]`) backed by three Route Handler proxies. The browser never sees the backend URL; all API traffic flows through Next.js handlers reading `API_URL` server-side. The created quote lives in TanStack Query cache (key `['quote', id]`) with `sessionStorage` persistence so refresh-within-tab works. The PDF is the shareable artifact — the web URL is intentionally single-tab/single-session.

**Tech Stack:** Next.js 15 (App Router, React 19, TypeScript), TanStack Query v5 + `@tanstack/react-query-persist-client`, shadcn/ui (Tailwind), react-hook-form + zod, react-pdf (pdfjs-dist), biome, pnpm, Vitest, Playwright + msw.

**Spec reference:** `docs/superpowers/specs/2026-05-02-marine-frontend-design.md`. Read it before starting — every architectural decision is documented there.

**Working directory for all commands below:** `/Users/foster/Documents/Marine-api/` (the repo root). The frontend lives at `marine-frontend/` (created in Task 1). Inside per-task `Run:` commands, paths are relative to `marine-frontend/` unless noted.

**Design constraints (apply across all UI tasks):**
- **No gradients.** Solid backgrounds and borders only. Never use `bg-gradient-*`, `from-*`, `to-*`, `via-*` Tailwind classes.
- **Dark + light mode, default = system.** Use `next-themes` with `attribute="class"` and `defaultTheme="system"`. Every component must look correct under both themes — rely on shadcn's CSS variables (`bg-background`, `text-foreground`, `border`, `text-muted-foreground`, etc.), never hard-coded colors.
- **Geist font.** Use `next/font/google`'s `Geist` (sans) and `Geist_Mono` (mono), exposed as CSS variables `--font-sans` and `--font-mono` on the `<body>`.

---

## Task 1: Bootstrap the Next.js project

**Files:**
- Create: `marine-frontend/` (whole directory tree via `create-next-app`)
- Create: `marine-frontend/biome.json`
- Modify: `marine-frontend/.gitignore` (add `public/pdf.worker.min.mjs`)
- Modify: `marine-frontend/package.json` (scripts)

- [ ] **Step 1: Scaffold the project**

Run from repo root (`/Users/foster/Documents/Marine-api/`):
```bash
pnpm create next-app@latest marine-frontend \
  --typescript --app --tailwind --eslint=false --src-dir=false \
  --import-alias="@/*" --use-pnpm --turbopack=false
```

Answer "No" to "Would you like to use Turbopack" if asked separately. We don't need it for this project size.

Expected: a `marine-frontend/` directory exists with a Next.js 15 + TS + Tailwind scaffold.

- [ ] **Step 2: Replace ESLint with biome**

Run:
```bash
cd marine-frontend
pnpm remove eslint eslint-config-next 2>/dev/null || true
pnpm add -D @biomejs/biome
```

Create `marine-frontend/biome.json` (mirrors `marine-api/biome.json` with frontend file globs):
```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "scripts/**/*.{mjs,ts}",
      "tests/**/*.{ts,tsx}",
      "next.config.{ts,mjs}",
      "vitest.config.ts",
      "playwright.config.ts"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useNodejsImportProtocol": "warn",
        "useTemplate": "warn"
      },
      "suspicious": {
        "noConsole": "off"
      },
      "correctness": {
        "noUnusedVariables": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  }
}
```

- [ ] **Step 3: Update `marine-frontend/package.json` scripts**

Set the `scripts` block to:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "biome check .",
  "format": "biome format --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test"
}
```

The `postinstall` script will be added in Task 4 (PDF worker setup).

- [ ] **Step 4: Update `.gitignore`**

Append to `marine-frontend/.gitignore`:
```
# PDF worker is copied from node_modules at install time
public/pdf.worker.min.mjs

# Test artifacts
/test-results
/playwright-report
/coverage
```

- [ ] **Step 5: Verify the scaffold runs**

Run from `marine-frontend/`:
```bash
pnpm dev
```
Expected: server starts on `http://localhost:3000`. Open it, see the default Next.js page. Stop with Ctrl-C.

- [ ] **Step 6: Commit**

Run from repo root:
```bash
git add marine-frontend/
git commit -m "feat(frontend): scaffold Next.js 15 + biome + Tailwind"
```

---

## Task 2: Install runtime + test dependencies

**Files:**
- Modify: `marine-frontend/package.json` (dependencies)

- [ ] **Step 1: Install runtime deps**

Run from `marine-frontend/`:
```bash
pnpm add \
  @tanstack/react-query@^5 \
  @tanstack/react-query-persist-client@^5 \
  @tanstack/query-sync-storage-persister@^5 \
  react-hook-form@^7 \
  @hookform/resolvers@^3 \
  zod@^3 \
  react-pdf@^9 \
  pdfjs-dist@^4 \
  sonner@^1 \
  next-themes@^0.4
```

- [ ] **Step 2: Install test deps**

Run:
```bash
pnpm add -D \
  vitest@^2 \
  @vitest/ui@^2 \
  @testing-library/jest-dom@^6 \
  jsdom@^25 \
  @playwright/test@^1.48 \
  msw@^2

pnpm exec playwright install chromium
```

The `playwright install chromium` step downloads the browser binary — only needed once per machine.

- [ ] **Step 3: Verify install**

Run:
```bash
pnpm install
```
Expected: clean install, no peer-dep warnings that block the build (warnings about React 19 are common with older libs but harmless here).

- [ ] **Step 4: Commit**

```bash
git add marine-frontend/package.json marine-frontend/pnpm-lock.yaml
git commit -m "feat(frontend): add runtime + test dependencies"
```

---

## Task 3: Initialize shadcn/ui and add primitives

**Files:**
- Create: `marine-frontend/components.json` (via shadcn init)
- Create: `marine-frontend/components/ui/*.tsx` (one file per primitive)
- Modify: `marine-frontend/app/globals.css` (shadcn rewrites this)

- [ ] **Step 1: Initialize shadcn**

Run from `marine-frontend/`:
```bash
pnpm dlx shadcn@latest init
```

Answer prompts:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

This creates `components.json` and rewrites `app/globals.css` with CSS variables.

- [ ] **Step 2: Add the primitives the spec calls for**

Run:
```bash
pnpm dlx shadcn@latest add button card form input label skeleton sonner
```

The `sonner` add wires the toaster.

- [ ] **Step 3: Verify primitives compile**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: no errors. (We aren't using these yet, but the files must type-check.)

- [ ] **Step 4: Commit**

```bash
git add marine-frontend/components.json marine-frontend/components/ui marine-frontend/app/globals.css marine-frontend/lib marine-frontend/package.json marine-frontend/pnpm-lock.yaml
git commit -m "feat(frontend): init shadcn/ui with button card form input label skeleton sonner"
```

---

## Task 4: Set up the pdf.js worker

**Files:**
- Create: `marine-frontend/scripts/copy-pdf-worker.mjs`
- Create: `marine-frontend/lib/pdf-worker.ts`
- Modify: `marine-frontend/package.json` (add `postinstall`)

- [ ] **Step 1: Create the copy script**

Create `marine-frontend/scripts/copy-pdf-worker.mjs`:
```js
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const src = resolve("node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = resolve("public/pdf.worker.min.mjs");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("✓ pdf.worker.min.mjs → public/");
```

- [ ] **Step 2: Wire the postinstall + handle pnpm 10's strict mode**

In `marine-frontend/package.json`, add to `"scripts"`:
```json
"postinstall": "node scripts/copy-pdf-worker.mjs"
```

If pnpm 10's strict-build mode blocks postinstall, add this to the same `package.json`:
```json
"pnpm": {
  "onlyBuiltDependencies": ["pdfjs-dist"]
}
```
(Pnpm will prompt during install if a build is needed; running `pnpm approve-builds pdfjs-dist` is the alternative.)

- [ ] **Step 3: Create the runtime worker config**

Create `marine-frontend/lib/pdf-worker.ts`:
```ts
import { pdfjs } from "react-pdf";

// Loaded as a module; safe to call at import time. The `/pdf.worker.min.mjs`
// path is served by Next.js from `public/`, where the postinstall script copies
// it (see scripts/copy-pdf-worker.mjs).
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
```

- [ ] **Step 4: Run the postinstall to verify**

Run from `marine-frontend/`:
```bash
node scripts/copy-pdf-worker.mjs
ls public/pdf.worker.min.mjs
```
Expected: file exists, ~1MB.

- [ ] **Step 5: Commit**

```bash
git add marine-frontend/scripts marine-frontend/lib/pdf-worker.ts marine-frontend/package.json
git commit -m "feat(frontend): copy pdfjs worker to public/ on install"
```

---

## Task 5: Build `lib/env.ts` (server-only env validation)

**Files:**
- Create: `marine-frontend/lib/env.ts`

This module reads `API_URL` once and gives the rest of the app a typed, validated value. Throws in production if missing; falls back to localhost in dev with a warning.

- [ ] **Step 1: Create the module**

Create `marine-frontend/lib/env.ts`:
```ts
import "server-only";

const isProd = process.env.NODE_ENV === "production";
const raw = process.env.API_URL?.trim();

if (isProd && !raw) {
  throw new Error(
    "API_URL is required in production. Set it in your hosting provider's env vars."
  );
}

const apiUrl = raw || "http://localhost:4000";

if (!isProd && !raw) {
  console.warn(`[env] API_URL not set, defaulting to ${apiUrl}`);
}

export const env = {
  API_URL: apiUrl,
} as const;
```

The `import "server-only"` enforces the rule that this module never gets bundled into client code. If a client component ever imports `lib/env.ts` (directly or transitively), Next.js fails the build.

- [ ] **Step 2: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add marine-frontend/lib/env.ts
git commit -m "feat(frontend): add lib/env.ts with prod/dev API_URL validation"
```

---

## Task 6: Build `lib/types.ts` (API DTOs)

**Files:**
- Create: `marine-frontend/lib/types.ts`

- [ ] **Step 1: Create the file**

Create `marine-frontend/lib/types.ts`:
```ts
export type QuoteClassType = "A" | "B" | "C";

export interface Quote {
  id: string;
  classType: QuoteClassType;
  cargoType: string;
  cargoValue: number;
  origin: string;
  destination: string;
  premium: number;
  createdAt: string;
}

export interface Policy {
  id: string;
  policyNumber: string;
  quoteId: string;
  customername: string;
  status: string;
  createdAt: string;
}

export interface CreateQuoteInput {
  classType: QuoteClassType;
  cargoType: string;
  cargoValue: number;
  origin: string;
  destination: string;
}

export interface IssuePolicyInput {
  quoteId: string;
  customername: string;
}

export interface IssuePolicyResponse {
  policy: Policy;
  certificatePath: string;
}

export interface ApiErrorResponse {
  errors?: string[];
  error?: string;
}
```

Field names match the backend exactly (camelCase `quoteId`, lowercase `customername`).

- [ ] **Step 2: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add marine-frontend/lib/types.ts
git commit -m "feat(frontend): add Quote/Policy/input types matching backend DTOs"
```

---

## Task 7: Build `lib/schemas.ts` with tests (TDD)

**Files:**
- Create: `marine-frontend/vitest.config.ts`
- Create: `marine-frontend/lib/schemas.ts`
- Create: `marine-frontend/tests/schemas.test.ts`

The zod schemas mirror the backend's `validateQuoteInput` / `validatePolicyInput` rules so we fail fast in the browser.

- [ ] **Step 1: Configure Vitest**

Create `marine-frontend/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Create `marine-frontend/tests/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write the failing test**

Create `marine-frontend/tests/schemas.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createQuoteSchema, issuePolicySchema } from "@/lib/schemas";

describe("createQuoteSchema", () => {
  const valid = {
    classType: "A" as const,
    cargoType: "electronics",
    cargoValue: 1000,
    origin: "Lagos",
    destination: "Rotterdam",
  };

  it("accepts a valid quote input", () => {
    expect(createQuoteSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects classType outside A|B|C", () => {
    const r = createQuoteSchema.safeParse({ ...valid, classType: "D" });
    expect(r.success).toBe(false);
  });

  it("rejects cargoValue <= 0", () => {
    expect(createQuoteSchema.safeParse({ ...valid, cargoValue: 0 }).success).toBe(false);
    expect(createQuoteSchema.safeParse({ ...valid, cargoValue: -5 }).success).toBe(false);
  });

  it("rejects non-finite cargoValue (NaN, Infinity)", () => {
    expect(createQuoteSchema.safeParse({ ...valid, cargoValue: Number.NaN }).success).toBe(false);
    expect(
      createQuoteSchema.safeParse({ ...valid, cargoValue: Number.POSITIVE_INFINITY }).success
    ).toBe(false);
  });

  it("rejects cargoType > 100 chars", () => {
    const r = createQuoteSchema.safeParse({ ...valid, cargoType: "x".repeat(101) });
    expect(r.success).toBe(false);
  });

  it("rejects empty cargoType", () => {
    expect(createQuoteSchema.safeParse({ ...valid, cargoType: "" }).success).toBe(false);
  });

  it("rejects origin/destination > 100 chars", () => {
    expect(createQuoteSchema.safeParse({ ...valid, origin: "x".repeat(101) }).success).toBe(false);
    expect(createQuoteSchema.safeParse({ ...valid, destination: "x".repeat(101) }).success).toBe(
      false
    );
  });
});

describe("issuePolicySchema", () => {
  const valid = {
    quoteId: "550e8400-e29b-41d4-a716-446655440000",
    customername: "Acme Logistics",
  };

  it("accepts a valid policy input", () => {
    expect(issuePolicySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-UUID quoteId", () => {
    expect(issuePolicySchema.safeParse({ ...valid, quoteId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects empty customername", () => {
    expect(issuePolicySchema.safeParse({ ...valid, customername: "" }).success).toBe(false);
  });

  it("rejects customername > 100 chars", () => {
    expect(
      issuePolicySchema.safeParse({ ...valid, customername: "x".repeat(101) }).success
    ).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
pnpm test
```
Expected: FAIL with "Cannot find module '@/lib/schemas'" or similar.

- [ ] **Step 4: Write the implementation**

Create `marine-frontend/lib/schemas.ts`:
```ts
import { z } from "zod";

export const createQuoteSchema = z.object({
  classType: z.enum(["A", "B", "C"]),
  cargoType: z.string().min(1).max(100),
  cargoValue: z
    .number()
    .refine((v) => Number.isFinite(v) && v > 0, "cargoValue must be > 0 and finite"),
  origin: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
});

export const issuePolicySchema = z.object({
  quoteId: z.string().uuid(),
  customername: z.string().min(1).max(100),
});

export type CreateQuoteSchema = z.infer<typeof createQuoteSchema>;
export type IssuePolicySchema = z.infer<typeof issuePolicySchema>;
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
pnpm test
```
Expected: all 12 tests pass.

- [ ] **Step 6: Commit**

```bash
git add marine-frontend/vitest.config.ts marine-frontend/tests marine-frontend/lib/schemas.ts
git commit -m "feat(frontend): zod schemas for quote/policy inputs (with tests)"
```

---

## Task 8: Build `lib/query-client.ts` (TanStack Query + persistence)

**Files:**
- Create: `marine-frontend/lib/query-client.ts`

The `sessionStorage` access is wrapped in try/catch so incognito tabs (which throw `SecurityError` on `sessionStorage`) fall back to in-memory cache and the app keeps working — persistence is just disabled.

- [ ] **Step 1: Create the module**

Create `marine-frontend/lib/query-client.ts`:
```ts
import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { Persister } from "@tanstack/react-query-persist-client";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
}

export function createPersister(): Persister | null {
  if (typeof window === "undefined") return null;
  try {
    // Probe sessionStorage — incognito tabs in some browsers throw here.
    const probeKey = "__rq_probe__";
    window.sessionStorage.setItem(probeKey, "1");
    window.sessionStorage.removeItem(probeKey);
    return createSyncStoragePersister({
      storage: window.sessionStorage,
      key: "marine-frontend-rq-cache",
    });
  } catch (err) {
    console.warn("[query-client] sessionStorage unavailable; persistence disabled.", err);
    return null;
  }
}
```

`staleTime: Infinity` is set because the only thing in cache is the just-created quote — it's not going to change, and we don't want auto-refetches.

- [ ] **Step 2: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add marine-frontend/lib/query-client.ts
git commit -m "feat(frontend): QueryClient + sessionStorage persister with incognito fallback"
```

---

## Task 9: Build `lib/api-client.ts` (browser-side fetch wrappers)

**Files:**
- Create: `marine-frontend/lib/api-client.ts`

These wrappers call the same-origin Next.js Route Handlers (not the backend directly). Each parses errors uniformly so hooks can rethrow typed errors.

- [ ] **Step 1: Create the module**

Create `marine-frontend/lib/api-client.ts`:
```ts
import type {
  ApiErrorResponse,
  CreateQuoteInput,
  IssuePolicyInput,
  IssuePolicyResponse,
  Quote,
} from "@/lib/types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorResponse | null = null;
  try {
    body = (await res.json()) as ApiErrorResponse;
  } catch {
    // non-JSON body
  }
  const message =
    body?.errors?.[0] ?? body?.error ?? `Request failed with status ${res.status}`;
  return new ApiError(message, res.status, body?.errors);
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const res = await fetch("/api/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as Quote;
}

export async function issuePolicy(input: IssuePolicyInput): Promise<IssuePolicyResponse> {
  const res = await fetch("/api/policy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as IssuePolicyResponse;
}

export async function fetchCertificateBlob(policyNumber: string): Promise<Blob> {
  const res = await fetch(`/api/policy/certificate/${encodeURIComponent(policyNumber)}`);
  if (!res.ok) throw await parseError(res);
  return res.blob();
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add marine-frontend/lib/api-client.ts
git commit -m "feat(frontend): typed browser fetch wrappers with ApiError parsing"
```

---

## Task 10: Build `app/api/quote/route.ts` with tests (TDD)

**Files:**
- Create: `marine-frontend/tests/api/quote.test.ts`
- Create: `marine-frontend/app/api/quote/route.ts`

- [ ] **Step 1: Write the failing test**

Create `marine-frontend/tests/api/quote.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_FETCH = global.fetch;

describe("POST /api/quote (proxy)", () => {
  beforeEach(() => {
    process.env.API_URL = "http://api.test";
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("forwards body to ${API_URL}/api/quote and returns 200 with backend body", async () => {
    const backendBody = { id: "q1", premium: 5, classType: "A" };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(backendBody), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const { POST } = await import("@/app/api/quote/route");
    const req = new Request("http://localhost:3000/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ classType: "A" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(backendBody);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/quote",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "content-type": "application/json" }),
        body: JSON.stringify({ classType: "A" }),
      })
    );
  });

  it("propagates 4xx body and status from backend", async () => {
    const errBody = { errors: ["classType must be A, B, or C"] };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(errBody), { status: 400 })
    );

    const { POST } = await import("@/app/api/quote/route");
    const req = new Request("http://localhost:3000/api/quote", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual(errBody);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm test tests/api/quote.test.ts
```
Expected: FAIL with module-not-found on `@/app/api/quote/route`.

- [ ] **Step 3: Write the implementation**

Create `marine-frontend/app/api/quote/route.ts`:
```ts
import { env } from "@/lib/env";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const upstream = await fetch(`${env.API_URL}/api/quote`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm test tests/api/quote.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add marine-frontend/tests/api/quote.test.ts marine-frontend/app/api/quote
git commit -m "feat(frontend): /api/quote proxy with body/status forwarding (tested)"
```

---

## Task 11: Build `app/api/policy/route.ts` with tests (TDD)

**Files:**
- Create: `marine-frontend/tests/api/policy.test.ts`
- Create: `marine-frontend/app/api/policy/route.ts`

Mirror Task 10 with the policy endpoint.

- [ ] **Step 1: Write the failing test**

Create `marine-frontend/tests/api/policy.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_FETCH = global.fetch;

describe("POST /api/policy (proxy)", () => {
  beforeEach(() => {
    process.env.API_URL = "http://api.test";
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("forwards body and returns 200 with backend body", async () => {
    const backendBody = {
      policy: { id: "p1", policyNumber: "POL-1234567890" },
      certificatePath: "/foo.pdf",
    };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(backendBody), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const { POST } = await import("@/app/api/policy/route");
    const req = new Request("http://localhost:3000/api/policy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quoteId: "abc", customername: "Acme" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(backendBody);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/policy",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("propagates 404 from backend (quote not found)", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Quote not found" }), { status: 404 })
    );

    const { POST } = await import("@/app/api/policy/route");
    const req = new Request("http://localhost:3000/api/policy", {
      method: "POST",
      body: JSON.stringify({ quoteId: "missing", customername: "X" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm test tests/api/policy.test.ts
```
Expected: FAIL with module-not-found.

- [ ] **Step 3: Write the implementation**

Create `marine-frontend/app/api/policy/route.ts`:
```ts
import { env } from "@/lib/env";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const upstream = await fetch(`${env.API_URL}/api/policy`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm test tests/api/policy.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add marine-frontend/tests/api/policy.test.ts marine-frontend/app/api/policy
git commit -m "feat(frontend): /api/policy proxy with body/status forwarding (tested)"
```

---

## Task 12: Build `app/api/policy/certificate/[policyNumber]/route.ts` (PDF stream proxy)

**Files:**
- Create: `marine-frontend/tests/api/certificate.test.ts`
- Create: `marine-frontend/app/api/policy/certificate/[policyNumber]/route.ts`

Critical: stream the body, never `await arrayBuffer()`. The backend's `Content-Disposition` header must pass through untouched so the download has the right filename.

- [ ] **Step 1: Write the failing test**

Create `marine-frontend/tests/api/certificate.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_FETCH = global.fetch;

describe("GET /api/policy/certificate/:policyNumber (proxy)", () => {
  beforeEach(() => {
    process.env.API_URL = "http://api.test";
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("streams the PDF and preserves content-type and content-disposition", async () => {
    const fakePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"
    global.fetch = vi.fn().mockResolvedValue(
      new Response(fakePdfBytes, {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="certificate-POL-1.pdf"',
        },
      })
    );

    const { GET } = await import("@/app/api/policy/certificate/[policyNumber]/route");
    const res = await GET(new Request("http://localhost:3000/api/policy/certificate/POL-1"), {
      params: Promise.resolve({ policyNumber: "POL-1" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="certificate-POL-1.pdf"'
    );

    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf).toEqual(fakePdfBytes);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/policy/certificate/POL-1"
    );
  });

  it("propagates 404 when backend can't find the cert", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 }));
    const { GET } = await import("@/app/api/policy/certificate/[policyNumber]/route");
    const res = await GET(new Request("http://localhost:3000/api/policy/certificate/POL-9"), {
      params: Promise.resolve({ policyNumber: "POL-9" }),
    });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm test tests/api/certificate.test.ts
```
Expected: FAIL with module-not-found.

- [ ] **Step 3: Write the implementation**

Create `marine-frontend/app/api/policy/certificate/[policyNumber]/route.ts`:
```ts
import { env } from "@/lib/env";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ policyNumber: string }> }
): Promise<Response> {
  const { policyNumber } = await params;
  const upstream = await fetch(
    `${env.API_URL}/api/policy/certificate/${encodeURIComponent(policyNumber)}`
  );

  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  const cd = upstream.headers.get("content-disposition");
  if (ct) headers.set("content-type", ct);
  if (cd) headers.set("content-disposition", cd);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm test tests/api/certificate.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add marine-frontend/tests/api/certificate.test.ts marine-frontend/app/api/policy/certificate
git commit -m "feat(frontend): streaming PDF cert proxy preserving content-disposition (tested)"
```

---

## Task 13: Build the three TanStack Query hooks

**Files:**
- Create: `marine-frontend/hooks/use-create-quote.ts`
- Create: `marine-frontend/hooks/use-issue-policy.ts`
- Create: `marine-frontend/hooks/use-quote.ts`

No unit tests for hooks (per spec §13 — exercised by E2E).

- [ ] **Step 1: Create `use-create-quote.ts`**

Create `marine-frontend/hooks/use-create-quote.ts`:
```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createQuote } from "@/lib/api-client";
import type { CreateQuoteInput, Quote } from "@/lib/types";

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<Quote, Error, CreateQuoteInput>({
    mutationFn: createQuote,
    onSuccess: (quote) => {
      queryClient.setQueryData(["quote", quote.id], quote);
      router.push(`/quotes/${quote.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
```

- [ ] **Step 2: Create `use-issue-policy.ts`**

Create `marine-frontend/hooks/use-issue-policy.ts`:
```ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, issuePolicy } from "@/lib/api-client";
import type { IssuePolicyInput, IssuePolicyResponse } from "@/lib/types";

export function useIssuePolicy() {
  const router = useRouter();

  return useMutation<IssuePolicyResponse, Error, IssuePolicyInput>({
    mutationFn: issuePolicy,
    onError: (err) => {
      if (err instanceof ApiError && err.status === 404) {
        toast.error("Quote not found.");
        router.push("/");
        return;
      }
      toast.error(err.message);
    },
  });
}
```

- [ ] **Step 3: Create `use-quote.ts`**

Create `marine-frontend/hooks/use-quote.ts`:
```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { Quote } from "@/lib/types";

export function useQuote(id: string) {
  return useQuery<Quote | undefined>({
    queryKey: ["quote", id],
    // No queryFn: there is no GET /api/quote/:id endpoint. The data is
    // populated by useCreateQuote.onSuccess via setQueryData.
    enabled: false,
  });
}
```

- [ ] **Step 4: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add marine-frontend/hooks
git commit -m "feat(frontend): TanStack Query hooks for create-quote / issue-policy / read-quote"
```

---

## Task 14: Build `components/quote-form.tsx` (RHF + zod)

**Files:**
- Create: `marine-frontend/components/quote-form.tsx`

- [ ] **Step 1: Create the component**

Create `marine-frontend/components/quote-form.tsx`:
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateQuote } from "@/hooks/use-create-quote";
import { type CreateQuoteSchema, createQuoteSchema } from "@/lib/schemas";

const CLASS_OPTIONS = [
  { value: "A", label: "A — Premium (10%)" },
  { value: "B", label: "B — Standard (0.7%)" },
  { value: "C", label: "C — Basic (0.5%)" },
] as const;

export function QuoteForm() {
  const mutation = useCreateQuote();
  const form = useForm<CreateQuoteSchema>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      classType: "B",
      cargoType: "",
      cargoValue: 0,
      origin: "",
      destination: "",
    },
  });

  const onSubmit = (values: CreateQuoteSchema) => {
    if (mutation.isPending) return;
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="classType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={mutation.isPending}
                >
                  {CLASS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cargoType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo type</FormLabel>
              <FormControl>
                <Input {...field} disabled={mutation.isPending} maxLength={100} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cargoValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo value (USD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  disabled={mutation.isPending}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origin</FormLabel>
              <FormControl>
                <Input {...field} disabled={mutation.isPending} maxLength={100} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <Input {...field} disabled={mutation.isPending} maxLength={100} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating quote…" : "Get quote"}
        </Button>
      </form>
    </Form>
  );
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add marine-frontend/components/quote-form.tsx
git commit -m "feat(frontend): QuoteForm with RHF + zod, disables on submit"
```

---

## Task 15: Build `components/quote-summary.tsx` and `components/policy-form.tsx`

**Files:**
- Create: `marine-frontend/components/quote-summary.tsx`
- Create: `marine-frontend/components/policy-form.tsx`

- [ ] **Step 1: Create `quote-summary.tsx`**

Create `marine-frontend/components/quote-summary.tsx`:
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quote } from "@/lib/types";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function QuoteSummary({ quote }: { quote: Quote }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote #{quote.id.slice(0, 8)}</CardTitle>
        <CardDescription>
          {quote.origin} → {quote.destination}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Class</div>
          <div className="font-medium">{quote.classType}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Cargo</div>
          <div className="font-medium">{quote.cargoType}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Cargo value</div>
          <div className="font-medium">{usd.format(quote.cargoValue)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Premium</div>
          <div className="font-medium">{usd.format(quote.premium)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create `policy-form.tsx`**

Create `marine-frontend/components/policy-form.tsx`:
```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useIssuePolicy } from "@/hooks/use-issue-policy";
import { type IssuePolicySchema, issuePolicySchema } from "@/lib/schemas";
import type { IssuePolicyResponse } from "@/lib/types";

interface Props {
  quoteId: string;
  onSuccess: (response: IssuePolicyResponse) => void;
}

export function PolicyForm({ quoteId, onSuccess }: Props) {
  const mutation = useIssuePolicy();
  const form = useForm<IssuePolicySchema>({
    resolver: zodResolver(issuePolicySchema),
    defaultValues: { quoteId, customername: "" },
  });

  const onSubmit = (values: IssuePolicySchema) => {
    if (mutation.isPending) return;
    mutation.mutate(values, {
      onSuccess,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer name</FormLabel>
              <FormControl>
                <Input {...field} disabled={mutation.isPending} maxLength={100} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="text-xs text-muted-foreground">
          Issuing against quote <code>{quoteId}</code>
        </div>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Issuing policy…" : "Issue policy"}
        </Button>
      </form>
    </Form>
  );
}
```

- [ ] **Step 3: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add marine-frontend/components/quote-summary.tsx marine-frontend/components/policy-form.tsx
git commit -m "feat(frontend): QuoteSummary + PolicyForm components"
```

---

## Task 16: Build `components/certificate-preview.tsx` (react-pdf)

**Files:**
- Create: `marine-frontend/components/certificate-preview.tsx`

- [ ] **Step 1: Create the component**

Create `marine-frontend/components/certificate-preview.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCertificateBlob } from "@/lib/api-client";
import "@/lib/pdf-worker"; // side-effect: configures pdfjs worker
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export function CertificatePreview({ policyNumber }: { policyNumber: string }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    fetchCertificateBlob(policyNumber)
      .then((blob) => {
        if (revoked) return;
        url = URL.createObjectURL(blob);
        setFileUrl(url);
      })
      .catch((err) => {
        toast.error("Couldn't load the certificate preview.");
        console.error("[certificate-preview] fetch failed", err);
      });
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [policyNumber]);

  if (!fileUrl) {
    return <Skeleton className="h-[800px] w-full max-w-[600px]" data-testid="cert-skeleton" />;
  }

  return (
    <div className="overflow-auto rounded border bg-muted/20 p-2">
      <Document
        file={fileUrl}
        onLoadError={(err) => {
          toast.error("Couldn't render the certificate.");
          console.error("[certificate-preview] render failed", err);
        }}
        loading={<Skeleton className="h-[800px] w-full max-w-[600px]" />}
      >
        <Page pageNumber={1} width={600} />
      </Document>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add marine-frontend/components/certificate-preview.tsx
git commit -m "feat(frontend): CertificatePreview with react-pdf and blob URL lifecycle"
```

---

## Task 17: Build `components/policy-issued.tsx` and `components/empty-state.tsx`

**Files:**
- Create: `marine-frontend/components/policy-issued.tsx`
- Create: `marine-frontend/components/empty-state.tsx`

- [ ] **Step 1: Create `policy-issued.tsx`**

Create `marine-frontend/components/policy-issued.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CertificatePreview } from "@/components/certificate-preview";
import type { Policy } from "@/lib/types";

export function PolicyIssued({ policy }: { policy: Policy }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // a11y: move focus to the issued banner so screen readers announce the
  // state change instead of leaving focus on the now-unmounted submit button.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const certHref = `/api/policy/certificate/${encodeURIComponent(policy.policyNumber)}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle ref={headingRef} tabIndex={-1} className="outline-none">
            Policy issued — {policy.policyNumber}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Customer:</span> {policy.customername}
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span> {policy.status}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <CertificatePreview policyNumber={policy.policyNumber} />
        <Button asChild>
          <a href={certHref} download>
            Download certificate
          </a>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `empty-state.tsx`**

Create `marine-frontend/components/empty-state.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote not found in this session</CardTitle>
        <CardDescription>
          Quotes are kept in your browser tab while you issue a policy. If you opened this URL
          fresh or closed the tab earlier, we don't have it anymore.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/">Start a new quote</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add marine-frontend/components/policy-issued.tsx marine-frontend/components/empty-state.tsx
git commit -m "feat(frontend): PolicyIssued (focus mgmt + download) and EmptyState"
```

---

## Task 18: Build the providers wrapper (theme + query)

**Files:**
- Create: `marine-frontend/components/providers.tsx`

The Providers component layers (outer → inner): `ThemeProvider` (next-themes) → `PersistQueryClientProvider` (or plain `QueryClientProvider` if storage is unavailable) → app children + `<Toaster>`.

- [ ] **Step 1: Create the Providers component**

Create `marine-frontend/components/providers.tsx`:
```tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { createPersister, createQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createQueryClient());
  const [persister] = useState(() => createPersister());

  const queryTree = persister ? (
    <PersistQueryClientProvider client={client} persistOptions={{ persister }}>
      {children}
      <Toaster richColors position="top-center" />
    </PersistQueryClientProvider>
  ) : (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {queryTree}
    </ThemeProvider>
  );
}
```

`attribute="class"` makes `next-themes` toggle a `class="dark"` on `<html>` so Tailwind's dark variants kick in. `defaultTheme="system"` honors the OS preference until the user explicitly picks one. When the persister is `null` (incognito tab fallback), the plain `QueryClientProvider` is used so the app still works without storage.

- [ ] **Step 2: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add marine-frontend/components/providers.tsx
git commit -m "feat(frontend): Providers wraps PersistQueryClientProvider with fallback"
```

---

## Task 19: Wire `app/layout.tsx` and build pages

**Files:**
- Modify: `marine-frontend/app/layout.tsx`
- Modify: `marine-frontend/app/page.tsx`
- Create: `marine-frontend/app/quotes/[id]/page.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

Overwrite `marine-frontend/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marine Cargo Insurance",
  description: "Issue marine cargo insurance quotes and certificates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-background text-foreground antialiased`}
      >
        <Providers>
          <main className="mx-auto max-w-2xl px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` on `<html>` is required by `next-themes` because the theme class is applied client-side, after the server-rendered HTML. Without this flag React logs a hydration mismatch on every page load.

Make sure `marine-frontend/app/globals.css` (rewritten by shadcn in Task 3) maps the font CSS variables. If the file does not already contain a `--font-sans` reference, append the following inside the `:root` block (or wherever shadcn's tokens live):
```css
:root {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```
Tailwind v4 picks these up via the `@theme` directive that shadcn's init writes by default. If you use a different Tailwind major version, add `fontFamily: { sans: ['var(--font-sans)'], mono: ['var(--font-mono)'] }` to `tailwind.config.ts` instead.

- [ ] **Step 2: Replace `app/page.tsx`**

Overwrite `marine-frontend/app/page.tsx`:
```tsx
import { QuoteForm } from "@/components/quote-form";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Get a marine cargo quote</h1>
        <p className="text-muted-foreground">
          Fill in the cargo details to see your premium. You can issue a policy on the next
          step.
        </p>
      </header>
      <QuoteForm />
    </div>
  );
}
```

- [ ] **Step 3: Create the detail page**

Create `marine-frontend/app/quotes/[id]/page.tsx`:
```tsx
"use client";

import { use, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PolicyForm } from "@/components/policy-form";
import { PolicyIssued } from "@/components/policy-issued";
import { QuoteSummary } from "@/components/quote-summary";
import { useQuote } from "@/hooks/use-quote";
import type { Policy } from "@/lib/types";

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: quote } = useQuote(id);
  const [policy, setPolicy] = useState<Policy | null>(null);

  if (!quote) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <QuoteSummary quote={quote} />
      {policy ? (
        <PolicyIssued policy={policy} />
      ) : (
        <PolicyForm quoteId={id} onSuccess={(r) => setPolicy(r.policy)} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify dev build**

Run from `marine-frontend/`:
```bash
pnpm exec tsc --noEmit
pnpm dev
```
Expected: server starts, `/` shows the quote form. Stop with Ctrl-C.

- [ ] **Step 5: Commit**

```bash
git add marine-frontend/app/layout.tsx marine-frontend/app/page.tsx marine-frontend/app/quotes
git commit -m "feat(frontend): wire layout, home page, and quote detail page"
```

---

## Task 20: Manual smoke test against the live backend

**Files:** none (verification only)

- [ ] **Step 1: Set the API URL**

Create `marine-frontend/.env.local`:
```
API_URL=https://marine-api-production.up.railway.app
```

(Do not commit `.env.local` — Next.js's default `.gitignore` already excludes it.)

- [ ] **Step 2: Run dev server**

Run from `marine-frontend/`:
```bash
pnpm dev
```

- [ ] **Step 3: Walk the happy path in a browser**

Open `http://localhost:3000`:
1. Fill: Class B, cargoType "electronics", cargoValue 1000, origin "Lagos", destination "Rotterdam".
2. Click "Get quote". Expect navigation to `/quotes/<uuid>`.
3. Quote card shows the premium (1000 × 0.007 = $7.00).
4. Enter customer name "Acme Logistics", click "Issue policy".
5. Page swaps to "Policy issued — POL-…", PDF preview renders below, "Download certificate" button works.
6. Refresh `/quotes/<uuid>`: state persists (still in State A or B depending on what you've done).
7. Open the same URL in a new incognito tab: expect the EmptyState fallback.

- [ ] **Step 4: Run lint + type-check + tests**

Run from `marine-frontend/`:
```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```
Expected: all pass.

If any of the above fail, fix the cause before moving on. Do not proceed to E2E with broken units.

- [ ] **Step 5: Commit (if `.env.local.example` was added or other tweaks)**

If you needed to commit anything (e.g., a `.env.local.example` for future devs), do so now. Otherwise skip.

---

## Task 21: Set up Playwright + msw and write the happy-path E2E

**Files:**
- Create: `marine-frontend/playwright.config.ts`
- Create: `marine-frontend/tests/e2e/fixtures.ts`
- Create: `marine-frontend/tests/e2e/handlers.ts`
- Create: `marine-frontend/tests/e2e/setup.ts`
- Create: `marine-frontend/tests/e2e/cert-fixture.pdf` (binary; see Step 4)
- Create: `marine-frontend/tests/e2e/happy-path.spec.ts`

Note: Playwright spec files use `.spec.ts` so they don't get picked up by Vitest's `.test.ts` glob.

- [ ] **Step 1: Configure Playwright**

Create `marine-frontend/playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    // The msw setup file in tests/e2e/setup.ts intercepts fetch calls
    // before they leave the Node server, so API_URL just needs to be a
    // syntactically-valid URL — nothing actually receives requests there.
    command: "API_URL=http://api.mock pnpm next dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: Create the canned API fixtures**

Create `marine-frontend/tests/e2e/fixtures.ts`:
```ts
export const FIXTURE_QUOTE_ID = "11111111-2222-4333-8444-555555555555";

export const FIXTURE_QUOTE = {
  id: FIXTURE_QUOTE_ID,
  classType: "B" as const,
  cargoType: "electronics",
  cargoValue: 1000,
  origin: "Lagos",
  destination: "Rotterdam",
  premium: 7,
  createdAt: "2026-05-02T00:00:00.000Z",
};

export const FIXTURE_POLICY = {
  id: "policy-1",
  policyNumber: "POL-1234567890",
  quoteId: FIXTURE_QUOTE_ID,
  customername: "Acme Logistics",
  status: "active",
  createdAt: "2026-05-02T00:00:01.000Z",
};
```

- [ ] **Step 3: Create msw handlers**

Create `marine-frontend/tests/e2e/handlers.ts`:
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { http, HttpResponse } from "msw";
import { FIXTURE_POLICY, FIXTURE_QUOTE } from "./fixtures";

const certBytes = readFileSync(resolve(__dirname, "cert-fixture.pdf"));

export const handlers = [
  http.post("http://api.mock/api/quote", async () => HttpResponse.json(FIXTURE_QUOTE)),
  http.post("http://api.mock/api/policy", async () =>
    HttpResponse.json({ policy: FIXTURE_POLICY, certificatePath: "/tmp/cert.pdf" })
  ),
  http.get("http://api.mock/api/policy/certificate/:policyNumber", async () => {
    return new HttpResponse(certBytes, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="certificate-${FIXTURE_POLICY.policyNumber}.pdf"`,
      },
    });
  }),
];
```

- [ ] **Step 4: Add a 1-page PDF fixture**

The msw handler needs a real PDF to return as the cert. Generate one with `pdfkit` (added as a dev-only fixture generator; not used at runtime).

From `marine-frontend/`:
```bash
pnpm add -D pdfkit
node -e '
const PDFDocument = require("pdfkit");
const fs = require("node:fs");
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream("tests/e2e/cert-fixture.pdf"));
doc.fontSize(24).text("Test Certificate", 100, 100);
doc.fontSize(12).text("Generated for E2E tests only. Not a real policy.", 100, 140);
doc.end();
'
ls -lh tests/e2e/cert-fixture.pdf
```
Expected: file exists, ~1–2 KB. Hand-rolling PDFs by hand is fragile (xref byte offsets must match precisely) — `pdfkit` produces a valid file every time.

Alternative if you'd rather not add a dev dep: hit the live Railway backend once, walk the happy path manually, save the resulting cert PDF as `tests/e2e/cert-fixture.pdf`. Either source is fine.

- [ ] **Step 5: Configure msw setup (Node-side intercept via global fetch)**

Create `marine-frontend/tests/e2e/setup.ts`:
```ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// This file is referenced by an instrumentation hook (see Step 6).
export const mswServer = setupServer(...handlers);
```

Create `marine-frontend/instrumentation.ts` (Next.js's official server-startup hook):
```ts
export async function register() {
  if (process.env.NODE_ENV !== "production" && process.env.MSW_ENABLED === "1") {
    const { mswServer } = await import("./tests/e2e/setup");
    mswServer.listen({ onUnhandledRequest: "bypass" });
    console.log("[msw] server-side handlers registered");
  }
}
```

Update `marine-frontend/playwright.config.ts` `webServer.command` so msw runs:
```ts
command: "API_URL=http://api.mock MSW_ENABLED=1 pnpm next dev",
```

- [ ] **Step 6: Write the happy-path spec**

Create `marine-frontend/tests/e2e/happy-path.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("quote → policy → cert preview → download", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Cargo type").fill("electronics");
  await page.getByLabel("Cargo value (USD)").fill("1000");
  await page.getByLabel("Origin").fill("Lagos");
  await page.getByLabel("Destination").fill("Rotterdam");

  await page.getByRole("button", { name: "Get quote" }).click();

  // Detail page
  await expect(page).toHaveURL(/\/quotes\/[0-9a-f-]+/i);
  await expect(page.getByText(/Quote #/)).toBeVisible();

  await page.getByLabel("Customer name").fill("Acme Logistics");
  await page.getByRole("button", { name: "Issue policy" }).click();

  await expect(page.getByText(/Policy issued — POL-/)).toBeVisible();

  // The cert preview either renders or shows the skeleton; either way the
  // download button must work.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download certificate" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^certificate-POL-/);
});
```

- [ ] **Step 7: Run E2E**

Run from `marine-frontend/`:
```bash
pnpm e2e
```
Expected: 1 test passes, ~10–30s.

If `pdf.worker.min.mjs` is missing (skipped postinstall), run `node scripts/copy-pdf-worker.mjs` once.

- [ ] **Step 8: Commit**

```bash
git add marine-frontend/playwright.config.ts marine-frontend/tests/e2e marine-frontend/instrumentation.ts
git commit -m "test(frontend): Playwright + msw happy-path E2E for the full flow"
```

---

## Task 22: Document and finalize

**Files:**
- Create: `marine-frontend/README.md`

- [ ] **Step 1: Write the README**

Create `marine-frontend/README.md`:
```markdown
# Marine Frontend

Next.js 15 frontend for the Marine Cargo Insurance API. Two pages:

- `/` — quote form
- `/quotes/[id]` — quote details, policy issuance, and inline PDF cert preview

## Stack

Next.js 15 (App Router) · TypeScript · TanStack Query v5 (sessionStorage-persisted) · shadcn/ui · react-hook-form + zod · react-pdf · biome · pnpm.

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
```

- [ ] **Step 2: Final verification — full clean run**

Run from `marine-frontend/`:
```bash
pnpm install
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
```
Expected: all pass, build emits `.next/` without warnings (other than benign React 19 peer-dep notices).

- [ ] **Step 3: Commit**

```bash
git add marine-frontend/README.md
git commit -m "docs(frontend): add README with stack, dev setup, and scripts"
```

- [ ] **Step 4: Push the branch and open a PR**

This is left to the operator's normal workflow (e.g. `/ship-pr` or manual `git push` + `gh pr create`). The plan is complete.

---

## Summary

22 tasks, each ending in a commit. The plan:

- **Tasks 1–4** scaffold the project, install deps, init shadcn, set up the pdf.js worker.
- **Tasks 5–9** build the foundation (`lib/`): env, types, schemas (TDD), QueryClient + persister, api-client.
- **Tasks 10–12** build the three Route Handler proxies (TDD with vitest).
- **Tasks 13–18** build the hooks, components, and providers wrapper.
- **Task 19** wires the layout and pages.
- **Task 20** is a manual smoke test against the live Railway backend.
- **Task 21** sets up Playwright + msw and writes the one happy-path E2E.
- **Task 22** documents and verifies a clean build.

Spec coverage at a glance:

| Spec section | Implementing task |
|---|---|
| §3 Stack (all libs) | 1, 2, 3 |
| §4 Repo layout | 1 |
| §5 `lib/env.ts`, dev ports | 5, 20, 22 |
| §6.1 Pages | 19 |
| §6.2 Route Handlers (incl. streaming PDF) | 10, 11, 12 |
| §7 Component tree | 14–19 |
| §8.1 Flow A (quote create) | 13, 14, 19 |
| §8.2 Flow B (policy + cert) | 13, 15, 16, 17, 19 |
| §9 State management + storage fallback | 8, 18 |
| §10.1 Error mapping (toasts, 404 redirect) | 13 |
| §10.2 QueryClient defaults | 8 |
| §10.3 Loading states | 14, 15, 16 |
| §10.4 Edge cases (empty state, double-submit, focus mgmt) | 14, 15, 17, 19 |
| §11 PDF preview specifics (worker, blob, revoke) | 4, 16 |
| §12 Download anchor + Content-Disposition | 12, 17 |
| §13 Testing scope | 7, 10, 11, 12, 21 |
| §14.5 a11y (focus on transition, polite live region) | 17, 18 |
| Design constraints (no gradients, theme, Geist) | 2, 18, 19, 22 |
