# Marine Frontend — Design Spec

**Date:** 2026-05-02
**Backend reference:** `marine-api/SPEC.md`
**Status:** Approved design, ready for implementation plan.

---

## 1. Goal

Build a small, single-user web frontend that exercises the Marine API's quote → policy → certificate flow end-to-end. The frontend treats the API as an external service (no shared code, no auth in v1).

**The shareable artifact is the certificate PDF, not the web URL.** The site is a transient UI for issuing a policy in one sitting; the PDF that comes out is the thing the user keeps.

## 2. Non-goals (v1)

- No auth, sessions, or per-user state.
- No quote list view, policy list view, or admin pages.
- No deep-linking, bookmarking, or cross-device URL sharing.
- No "save and resume later" flow — work is single-tab, single-session.
- No mobile-first design (desktop demo is the target; mobile should not break, but isn't optimized).

## 3. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router, React 19) | TypeScript |
| Server state | TanStack Query v5 | + `@tanstack/query-sync-storage-persister` to `sessionStorage` |
| UI components | shadcn/ui | Tailwind under the hood |
| Forms | react-hook-form + zod | Zod schemas mirror backend `validateQuoteInput` / `validatePolicyInput` |
| PDF rendering | `react-pdf` (pdf.js) | Worker copied from `pdfjs-dist` into `public/pdf.worker.min.mjs` |
| Lint/format | biome | Matches `marine-api/biome.json` |
| Package manager | pnpm | Matches existing repo |
| Testing | Vitest (unit) + Playwright (E2E happy path) | API mocked in E2E |

## 4. Repo layout

```
/Users/foster/Documents/Marine-api/
├── marine-api/        # existing backend (untouched by this work)
└── marine-frontend/   # NEW — standalone Next.js app, own package.json, own lockfile
```

The frontend is **not** a workspace member of the backend. It treats the API as an external service whose URL is configured at runtime.

## 5. Configuration

| Env var | Scope | Purpose |
|---|---|---|
| `API_URL` | Server-only (no `NEXT_PUBLIC_` prefix) | Backend base URL, e.g. `http://localhost:3001` in dev, Railway URL in prod |

The browser never sees `API_URL`. All backend calls go through Next.js Route Handlers (see §7).

**Dev port:** Next.js stays on `:3000`; the backend moves to `:3001` (`PORT=3001 pnpm start` in `marine-api/`). This avoids the existing CORS-default collision on `:3000`.

## 6. Routes

### 6.1 Pages

| Path | Purpose |
|---|---|
| `/` | Quote form. Submits → navigates to `/quotes/[id]`. |
| `/quotes/[id]` | Two-state page (see §8). Shows quote → collects customer name → issues policy → renders cert preview + download. |

There is no `/policies/...` route in v1. Policy issuance and cert preview live on the quote detail page.

### 6.2 Route Handlers (server-side proxies)

| Path | Method | Forwards to |
|---|---|---|
| `/api/quote` | POST | `${API_URL}/api/quote` |
| `/api/policy` | POST | `${API_URL}/api/policy` |
| `/api/policy/certificate/[policyNumber]` | GET | `${API_URL}/api/policy/certificate/<num>` (streams PDF, preserves `Content-Type` and `Content-Disposition`) |

Handlers are thin: read body/params, fetch upstream, return response. No transformation. Status codes and error bodies pass through unchanged so the frontend's TanStack Query layer sees real backend errors.

## 7. Component tree

```
app/
  layout.tsx                       — fonts, <Toaster />, QueryClientProvider, persistence boot
  page.tsx                         — / : <QuoteForm />
  quotes/[id]/page.tsx             — /quotes/[id] : <QuoteDetailPage />
  api/
    quote/route.ts                 — POST proxy
    policy/route.ts                — POST proxy
    policy/certificate/[policyNumber]/route.ts  — GET PDF proxy

components/
  quote-form.tsx                   — RHF + zod, calls useCreateQuote()
  quote-summary.tsx                — read-only quote card (id, class, cargo, premium, route)
  policy-form.tsx                  — customer-name input, calls useIssuePolicy()
  policy-issued.tsx                — issued banner + <CertificatePreview /> + download button
  certificate-preview.tsx          — react-pdf <Document><Page /> rendering /api/policy/certificate/<num>
  empty-state.tsx                  — shown on /quotes/[id] when cache miss; "Start a new quote" link
  ui/                              — shadcn primitives (button, card, form, input, label, skeleton, toaster)

lib/
  api-client.ts                    — typed fetch wrappers (browser-side)
  schemas.ts                       — zod schemas for Quote + Policy inputs
  query-client.ts                  — QueryClient config + sessionStorage persistence boot
  pdf-worker.ts                    — pdfjs.GlobalWorkerOptions.workerSrc setup
  types.ts                         — Quote, Policy, ErrorResponse types

hooks/
  use-create-quote.ts              — useMutation(POST /api/quote) → setQueryData(['quote', id])
  use-issue-policy.ts              — useMutation(POST /api/policy)
  use-quote.ts                     — useQuery(['quote', id]) reading from cache only
```

### 7.1 Why this split

- `QuoteDetailPage` is a thin container holding `policy: Policy | null` in local state. Renders `<PolicyForm />` when null, `<PolicyIssued />` when set. One conditional, no router games.
- Forms own their validation; pages don't import zod.
- Hooks own server-state concerns (loading, errors, toasts on failure). Components stay declarative.
- `certificate-preview.tsx` is dumb — takes a `policyNumber`, fetches the PDF blob, hands it to `react-pdf`. Easy to swap engines later if needed.

## 8. Data flow

### 8.1 Flow A — Create a quote (`/`)

```
QuoteForm submit
  → RHF + zod validate locally (classType A|B|C, cargoType ≤100, cargoValue>0 finite,
                                origin ≤100, destination ≤100)
  → useCreateQuote.mutate(payload)
      → fetch POST /api/quote (Route Handler)
          → Route Handler: fetch POST ${API_URL}/api/quote
          → backend returns { id, classType, cargoType, cargoValue, origin, destination,
                              premium, createdAt }
      → onSuccess:
          - queryClient.setQueryData(['quote', data.id], data)
          - persistence layer flushes to sessionStorage
          - router.push(`/quotes/${data.id}`)
      → onError: toast.error(parsed message); form stays filled
```

### 8.2 Flow B — Issue policy + render cert (`/quotes/[id]`)

```
Page mount
  → useQuote(id): useQuery(['quote', id], { enabled: false })
      reads cache only — no network call (no GET /api/quote/:id endpoint exists)
  → if cache empty (e.g. user opened URL in a fresh tab):
      render <EmptyState> → "Couldn't find that quote in this session" + link to /

PolicyForm submit (customer name only; quote id from URL/cache, shown read-only)
  → RHF + zod validate (customername ≤100, non-empty)
  → useIssuePolicy.mutate({ Quoteid: id, customername })
      → fetch POST /api/policy
          → Route Handler: fetch POST ${API_URL}/api/policy
          → backend returns { policy, certificatePath }
      → onSuccess: setPolicy(policy)  // local React state, triggers State A → State B
      → onError: toast.error(parsed message); button re-enabled

State B (policy set)
  → <CertificatePreview policyNumber={policy.policyNumber} />
      → fetch GET /api/policy/certificate/<num> as blob
      → react-pdf renders Document/Page from the blob
      → skeleton shown while loading
  → <a download href="/api/policy/certificate/<num>"> "Download certificate" </a>
```

## 9. State management

**TanStack Query** holds the only server-state-ish thing in the app: the quote that was just created.

- Query key: `['quote', id]`
- Populated by: `useCreateQuote` mutation's `onSuccess` via `setQueryData`. No `queryFn` runs from the network because `GET /api/quote/:id` doesn't exist.
- Read by: `useQuote(id)` on the detail page, with `enabled: false` to prevent network calls.

**Persistence** — `persistQueryClient` from `@tanstack/react-query-persist-client` + `createSyncStoragePersister({ storage: sessionStorage })`. Configured at app boot in `lib/query-client.ts`. Survives same-tab refresh; clears when the tab closes.

**Known limitation (intentional v1 trade-off):** the URL `/quotes/[id]` is single-tab/single-session. Bookmarking, sharing, opening in another browser/device, or returning after a tab close all show the empty state. This is acceptable because **the PDF is the shareable artifact, not the URL**.

If a future version needs shareable URLs, the fix is `GET /api/quote/:id` on the backend (Prisma `findUnique`); the frontend swaps `enabled: false` to a real `queryFn`.

## 10. Error handling

### 10.1 Mapping backend responses

| Status | Cause | Frontend behavior |
|---|---|---|
| `400` | `{ errors: string[] }` from `validateQuoteInput` / `validatePolicyInput` | Toast first error; remaining logged. Form stays filled. |
| `404` | Quote not found on `POST /api/policy` | Toast "Quote not found." Redirect to `/`. |
| `500` | Unique-constraint collision on `policyNumber`, Puppeteer failure, etc. | Toast "Something went wrong, please try again." Mutation state cleared, button re-enabled. |
| Network error / timeout | API down, DNS, fetch failure | Toast "Can't reach the API." Inline retry on the form. |

### 10.2 QueryClient defaults

```ts
{
  queries: { retry: 1, refetchOnWindowFocus: false },
  mutations: { retry: false },  // never silently retry user-side actions
}
```

4xx responses are parsed and surfaced; 5xx and network errors get one retry on queries, none on mutations.

### 10.3 Loading states

- Form submit (quote, policy): button disabled, inline spinner, inputs disabled.
- Cert preview: shadcn `<Skeleton>` placeholder sized to a typical PDF page until react-pdf finishes parsing.
- Cert download anchor: always enabled once `policy` is set; the underlying file is generated server-side before `POST /api/policy` returns.

### 10.4 Edge cases

- **Direct-load `/quotes/[id]` with empty cache** → `<EmptyState>` with a "Start a new quote" link to `/`. No spinner, no API call.
- **react-pdf fails to render the blob** → toast "Couldn't render the certificate" + the download anchor remains as a fallback.
- **Double-submit on policy form** → submit button has `disabled={mutation.isPending}` and the form's `onSubmit` early-returns if a mutation is already in flight. (TanStack Query mutations don't dedupe by key like queries do; the disabled-button gate is the real safeguard.)
- **Backend zod drift** → frontend zod is UX-layer only. The backend's 400 response is the source of truth and surfaces via toast if it disagrees with the client.

## 11. PDF preview specifics

- `react-pdf` is configured once in `lib/pdf-worker.ts`. Worker file is copied from `pdfjs-dist/build/pdf.worker.min.mjs` into `public/` at install time (postinstall script) so `GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'` works without a CDN.
- `<CertificatePreview>` fetches `/api/policy/certificate/<num>` as a `Blob`, converts to a `URL.createObjectURL(blob)`, passes that to `<Document file={url}>`. Revokes the object URL on unmount.
- Single-page render only in v1 (the cert template is one page). If multi-page is added later, page navigation is a `react-pdf` prop change.

## 12. Download behavior

- The "Download certificate" button is a plain `<a download href="/api/policy/certificate/<num>">` — no fetch, no blob juggling, no extra mutation. The browser's download manager handles it.
- The Route Handler proxies the backend's `Content-Disposition: attachment; filename="certificate-<num>.pdf"` header through unchanged, so the downloaded file has a meaningful name.

## 13. Testing scope (v1)

| Layer | Tool | Scope |
|---|---|---|
| Zod schemas | Vitest | Each schema gets a parametric test: valid case, every documented invalid case (missing required, wrong type, out-of-range, too long). |
| Route Handlers | Vitest | One unit test per handler: forwards method/body, propagates status, propagates `Content-Disposition` for the PDF route. Uses `fetch` mock. |
| End-to-end | Playwright + `msw` | One happy-path test: load `/`, fill quote form, land on detail page, fill customer name, see cert preview render, click download, assert download triggered. `msw` intercepts requests to `${API_URL}/...` and returns canned quote/policy responses + a fixture PDF blob. No live API call. |

No component-level UI tests in v1. shadcn primitives are trusted; interaction logic that matters lives in hooks and is exercised by the E2E test.

## 14. Open questions / future work

- **`GET /api/quote/:id`** — would unlock shareable URLs. Out of scope for v1 frontend, but the smallest useful backend addition if the demo grows.
- **Mobile PDF rendering polish** — `react-pdf` handles it, but layout (page width, pinch-zoom) hasn't been designed.
- **Cert template** — currently a static HTML template in the backend. A "preview before issue" feature would need a backend endpoint that renders without persisting, which is non-trivial because the policy number is part of the cert.
- **Web Share API** for the PDF — a "Share" button alongside "Download" using `navigator.share({ files: [pdfFile] })` on supported browsers. Strictly nice-to-have.

## 15. Decisions log (record of what was considered)

| Decision | Chosen | Considered | Why |
|---|---|---|---|
| State manager | TanStack Query + sessionStorage persistence | RSC + Server Actions; raw fetch; Redux | Server-state-heavy app, want optimistic UX, want to learn/use RQ. User explicitly requested. |
| Project shape | Standalone `marine-frontend/` | pnpm workspace; full `apps/` monorepo | Frontend treats API as external service; matches Railway deployment model; no need for shared code in v1. |
| API call style | Server-side proxy via Route Handlers | Direct browser-to-backend with CORS | Keeps `API_URL` server-only; one origin in browser; no CORS config needed; auth-ready later. |
| Page count | 2 (`/`, `/quotes/[id]`) | 1 (single-page state machine); 3 (`/`, `/quotes/[id]`, `/policies/[num]`) | Refresh-safe URLs, but no extra route just to host the cert preview when state-flip on the detail page is fine. |
| PDF render | `react-pdf` | `<iframe>` | User chose; consistent rendering across browsers including mobile, worth the ~200kb. |
| URL-shareability | Not supported | Add `GET /api/quote/:id` to backend | The PDF is the shared artifact. Web URL is transient. Avoids backend scope creep. |
