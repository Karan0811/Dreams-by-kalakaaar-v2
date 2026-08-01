# DEVELOPMENT_STATUS.md — Sprint 01: Products Module

**Branch:** `feature/sprint-01-products`
**Base:** `master` (`ec66ab8`)
**Latest commit:** `11715a5e011db5b3a294204db557637a5f63cd06`
**Total commits on branch:** 25 (full history below)
**Working tree:** clean, nothing uncommitted

---

## 1. Completed features

### Backend — Products module extensions
- **Search / Filters / Sort / Pagination** on both `GET /v1/products` (public)
  and `GET /v1/stores/{storeId}/products` (creator-scoped): free-text `q`,
  `categoryId`/`storeId`/`productType` filters, `minPrice`/`maxPrice`,
  `inStockOnly`, and five sort options (`newest`, `oldest`, `priceLow`,
  `priceHigh`, `bestSelling`). `newest`/`oldest` use the existing keyset
  cursor; the other three use page-number pagination instead — documented,
  deliberate trade-off (see `productSortSchema` doc comment).
- **Soft delete**: `DELETE /v1/stores/{storeId}/products/{productId}`, a
  real `deletedAt` column distinct from the existing `ARCHIVED` status.
- **Product Images**: two-step presigned-R2-upload flow
  (`POST .../media/upload-url` → `POST .../media` to confirm/attach),
  `PATCH`/`DELETE .../media/{id}`.
- **Inventory Management**: `PATCH .../variants/{variantId}/inventory`,
  always a signed delta, never a raw overwrite.
- **OpenAPI/Swagger**: `GET /api/docs`, `/api/openapi.json`,
  `/api/openapi.yaml`, all served from `backend/openapi/v1.yaml`.
- **`GET /v1/creator/application`** now returns `storeId`/`storeSlug`/
  `storeStatus`.

### Frontend — Buyer
- `/products` search box, price-range filter, in-stock toggle, corrected
  sort dropdown, explicit error+retry state — all wired to the real
  backend query contract (not the previous, never-tested aspirational one).

### Frontend — Creator (net new — this surface didn't exist before this sprint)
- `/dashboard/products` — My Products: status tabs, search, delete
  confirmation, empty/loading/error states.
- `/dashboard/products/new` — Create Product: variant-aware form
  (react-hook-form + zod, matching backend validation field-for-field),
  unsaved-changes warning.
- `/dashboard/products/{id}/edit` — Edit Product: basic-info form,
  publish/pause/archive/delete, per-variant inventory adjustment, image
  gallery (upload/delete), read-only buyer-preview card.
- New `Dialog` UI primitive (Radix, previously an unused dependency).

### Real bugs found and fixed (not Sprint 01 regressions — pre-existing, surfaced while building this)
1. `findMediaForProduct` never joined the `media` table — product
   responses never included an actual image URL.
2. `GET /v1/creator/application` never exposed `storeId` — no read path
   exposed the Creator to Store relationship at all.
3. `pnpm install` silently exited 1 on every fresh install
   (`ERR_PNPM_IGNORED_BUILDS`) — pnpm 11 needs `allowBuilds` in
   `pnpm-workspace.yaml`, which didn't exist.
4. The OpenAPI spec lived outside `backend/` (`api/openapi/v1.yaml` at repo
   root), unservable if `backend/` is deployed as its own Vercel root.
5. `npm run lint` failed outright for every package, for five independent
   reasons: missing `eslint.config.mjs` in 5 shared packages; `@dbk/config`
   never declaring the eslint plugins its own config imports; a genuine
   crash in `@typescript-eslint/no-unused-vars@8.65.0` on any zero-param
   function type; a symlink-fragile 3-level relative tsconfig `extends`
   path; and `consistent-type-imports` requiring type-aware parsing that
   was never configured.
6. `better-auth`'s client method is `requestPasswordReset`, not
   `forgetPassword`/`forgotPassword`.
7. React 19.2 broke `Textarea.tsx`'s `onInput` typing.
8. Several pre-existing `react/no-unescaped-entities` and one
   `jsx-a11y/label-has-associated-control` issue.

Full detail and rationale for every item above is in `CHANGELOG.md` and the
individual commit messages (each fix is its own commit).

---

## 2. Remaining work / recommended next sprint

**Priority 1 — Auth bridge.** The frontend's Better Auth session and the
backend's JWT-based `authenticate()` middleware are two independent,
unbridged systems. See `frontend/packages/auth/src/access-token.ts`'s full
doc comment for the trace-through. This blocks live, end-to-end
verification of every creator-side backend call (Products included, and
the pre-existing dashboard pending-actions/performance widgets too — this
predates Sprint 01). `getBackendAccessToken()` currently, correctly,
always returns `null`, and every caller fails loudly
(`501 AUTH_BRIDGE_NOT_CONFIGURED`) rather than faking success. Fixing this
for real means either (a) replacing the frontend's local Better Auth
session with one obtained by calling the backend's REST auth endpoints
directly, or (b) a JWKS-based bridge so the backend can verify the
frontend's Better Auth session tokens too. This is legitimate,
cross-cutting Authentication-sprint work.

**Priority 2 — Variant editing.** There's no backend endpoint to edit a
variant's price/SKU after creation (only at creation time via
`POST /products`). The creator Edit page correctly shows variants
read-only rather than pretending this works. A follow-up sprint should add
`PATCH .../variants/{id}` (price/SKU only — quantity already has its own
endpoint) if this is needed before launch.

**Priority 3 — Categories/Collections/Tags/SEO.** Deliberately deferred
per `backend/SCOPE.md` and the staged-scope decision made at the start of
this sprint. `primaryCategoryId` is accepted as a raw UUID with no picker
UI, since there's no `GET /categories` endpoint yet.

**Priority 4 — Inventory audit ledger.** Adjustments are correctly
delta-based (never a lost-update overwrite) but don't persist a
per-adjustment audit row (`InventoryTransaction`, `08-database-design.md`
Section 9.2) yet.

**Smaller items:**
- No global `/dashboard/inventory` view (only per-product, on the Edit page).
- Buyer product detail page's image rendering wasn't traced/verified this
  sprint — the buyer `Product`/`ProductImage` types are a separate,
  richer, pre-existing "aspirational" shape than the raw backend response;
  worth reconciling in a follow-up.
- `npm audit` reports 12 vulnerabilities (11 high, 1 critical) in the
  frontend workspace, pre-existing, not investigated this sprint (out of
  scope for a Products-focused sprint; flagging for visibility).

---

## 3. Modified / new files

Full detail: `git diff --stat ec66ab8 HEAD` (100 files changed, 7089
insertions, 775 deletions). By area:

**Backend** — 28 files changed (12 new, 16 modified), 2012 insertions.
Key new files: `openapi/v1.yaml` (relocated + extended), 6 new Route
Handlers under `stores/[storeId]/products/[productId]/media/**` and
`.../variants/[variantId]/inventory/`, `src/app/api/docs/route.ts`,
`src/app/api/openapi.json/route.ts`, `src/app/api/openapi.yaml/route.ts`,
`src/shared/openapi/spec.ts`, `src/modules/products/authorization.ts`,
`src/modules/products/__tests__/schemas.test.ts`,
`database/migrations/0001_sprint01_products_soft_delete.sql`.

**Frontend** — 69 files changed, 2383 insertions. Key new files: all of
`apps/creator/app/(dashboard)/dashboard/products/**`,
`apps/creator/app/api/products/**`, 9 new files under
`apps/creator/components/Product*.tsx`, `apps/creator/lib/*`,
`packages/api-client/src/{hooks/useCreatorProducts.ts,endpoints/creator-products.server.ts,endpoints/creator-application.server.ts}`,
`packages/auth/src/access-token.ts`,
`packages/ui/src/primitives/Dialog.tsx`, `eslint.config.mjs` in 5
previously-config-less packages.

**Docs** — `CHANGELOG.md` (new), `docs/testing/sprint-01-products.md`
(new), `README.md` / `backend/README.md` / `frontend/README.md` (updated).

---

## 4. Database changes

Single migration: `database/migrations/0001_sprint01_products_soft_delete.sql`
(generated via `drizzle-kit generate`, not hand-written):

```sql
ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp with time zone;
CREATE INDEX "products_deleted_at_idx" ON "products" USING btree ("deleted_at");
```

No other schema changes — Product Images and Inventory Management both
reuse existing tables (`media`, `product_media`, `inventory`) that were
already in the schema but had no working consumer until this sprint.

---

## 5. API endpoints (new/changed this sprint)

| Method | Path | Notes |
|---|---|---|
| GET | `/v1/products` | extended: `q`, filters, `sort`, `page` |
| GET | `/v1/stores/{storeId}/products` | extended: same, plus `status` |
| DELETE | `/v1/stores/{storeId}/products/{productId}` | new — soft delete |
| POST | `/v1/stores/{storeId}/products/{productId}/media/upload-url` | new |
| POST | `/v1/stores/{storeId}/products/{productId}/media` | new |
| PATCH | `/v1/stores/{storeId}/products/{productId}/media/{id}` | new |
| DELETE | `/v1/stores/{storeId}/products/{productId}/media/{id}` | new |
| PATCH | `/v1/stores/{storeId}/products/{productId}/variants/{id}/inventory` | new |
| GET | `/v1/creator/application` | extended: `storeId`/`storeSlug`/`storeStatus` |
| GET | `/api/docs` | new — Swagger UI |
| GET | `/api/openapi.json` | new |
| GET | `/api/openapi.yaml` | new |

Full contract: `backend/openapi/v1.yaml`, or `/api/docs` once the server is running.

---

## 6. Validation results (this session, this sandbox)

| Check | Command | Result |
|---|---|---|
| Backend install | `pnpm install` | PASS (fixed a determinism issue) |
| Backend lint | `pnpm lint` | PASS |
| Backend typecheck | `pnpm typecheck` | PASS |
| Backend build | `pnpm build` | PASS — all 26 routes compiled |
| Backend tests | `pnpm test` | PASS — 25/25 (vitest) |
| Frontend install | `npm install` | PASS |
| Frontend lint | `npm run lint` | PASS — 0 errors (workspace-wide, 8 packages) |
| Frontend typecheck | `npm run typecheck` | PASS — 0 errors (8 packages) |
| Frontend build | `npm run build` | BLOCKED — environment-specific, see below |

### Frontend build block — full detail

- **Command:** `npm run build`
- **Exact error:** `request to https://fonts.googleapis.com/... failed, reason: self-signed certificate in certificate chain` then `Failed to fetch 'Inter'/'Fraunces' from Google Fonts` then `Failed to compile` in `app/layout.tsx`.
- **Root cause, directly confirmed** (not inferred): a standalone `curl -v https://fonts.googleapis.com/...` (no repo code involved) returned `HTTP/2 403`, header `x-deny-reason: host_not_allowed`, body `Host not in allowlist: fonts.googleapis.com`. This sandbox's outbound network is allowlisted to a fixed set of domains (package registries, GitHub) and does not include Google Fonts. The proxy returns a self-signed cert for blocked hosts, which is exactly the TLS error `next/font/google` surfaces.
- **Environment-specific, not code-related.** `app/layout.tsx` in both apps uses standard, correct `next/font/google` usage. This will build successfully in any environment with normal internet access (Vercel, CI, a developer's machine). No mock, stub, or workaround file was introduced to route around this — the only diagnostic action taken outside `npm run build` was a plain `curl` to confirm the exact cause; no repository files were touched to work around it.
- Both apps fail at the identical point (`app/layout.tsx`, before any other file is even compiled), so this masks nothing else — `npm run typecheck` (full TypeScript across all new JSX) and `npm run lint` (0 errors) are the strongest available signals in this sandbox that the code itself is correct.

### Regression check (live server, this session)
Ran the backend with `next start` against this sandbox (no live Postgres available):
- `GET /api/v1/health` → 200
- `GET /api/openapi.json` → 200, 23 paths present
- `GET /api/docs` → 200
- `POST /v1/auth/register` with empty body → 422 (validation runs before any DB call)
- `GET /v1/products` → 500, root cause `ECONNREFUSED 127.0.0.1:5432` — no Postgres instance running in this sandbox. Not a code defect: the error is a raw driver connection failure, not an application error, and every non-DB-dependent code path (health, validation, auth-gating) behaves correctly.
- `POST /v1/creator/apply`, `GET /v1/creator/application`, `GET /v1/stores/{id}/products` (unauthenticated) → all 401, correctly, before any DB call

---

## 7. Known issues

1. **Auth bridge gap** (see Section 2, Priority 1) — blocks live E2E verification
   of all creator-side backend calls. Not introduced by this sprint.
2. **No live database in this sandbox** — every DB-dependent code path was
   verified via `pnpm test` (unit tests, no DB required),
   `pnpm build`/`next build` (compiles and type-checks all query code), and
   direct reading of the generated SQL/Drizzle query builders, but not
   against a real Postgres instance with real data. A real environment
   should run through `docs/testing/sprint-01-products.md` in full.
3. **Frontend `npm run build`** blocked by sandbox network policy (see
   Section 6) — not a code issue, needs verification in an environment
   with normal internet access.
4. **npm audit**: 12 vulnerabilities (11 high, 1 critical) in the frontend
   workspace's dependency tree, pre-existing, not investigated this sprint.
5. **Variant editing** not supported post-creation (see Section 2, Priority
   2) — intentional, not a bug, but worth flagging as a UX gap.
6. Buyer product detail image rendering not traced this sprint (see
   Section 2).

---

## 8. Next steps

1. Land the auth bridge (Priority 1) — unblocks real E2E testing of
   everything else in this sprint.
2. Run `docs/testing/sprint-01-products.md` against a real environment
   (live Postgres, Redis, R2 bucket, normal internet access) and check off
   every box.
3. Open the PR from `feature/sprint-01-products` into `master` (branch is
   pushed and ready — see push status in the accompanying chat response).
4. Address `npm audit` findings in a dedicated pass.
5. Decide whether variant price/SKU editing is needed before the next
   customer-facing milestone; if so, add `PATCH .../variants/{id}`.
