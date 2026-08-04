# DEVELOPMENT_STATUS.md — Sprint 01 Products Module + Hardening Pass

**Repository state:** local git history in this delivered ZIP (this sandbox
has no push credentials — same constraint noted throughout this project).
Latest commit at hand-off is shown by `git log --oneline -1` in the
delivered ZIP; the final validation/packaging commit lands after this
document.

This document is the master Implementation Report. Dedicated topics that
would otherwise duplicate content live in their natural home instead:
- **Migration / Seed / Database Reset / Environment Variables / Deployment**: `backend/README.md`
- **Full change list**: `CHANGELOG.md`
- **Manual test plan**: `docs/testing/sprint-01-production.md`

---

## 1. What's in this delivery

### Sprint 01 (Products Module)
Backend: search/filter/sort/pagination, soft delete, Product Images
(presigned R2 upload), Inventory Management, OpenAPI/Swagger. Buyer:
search/filter/sort UI. Creator: full My Products / Create / Edit surface,
built from nothing.

### Hardening Pass (this continuation)
- **Phase 2** — reusable-component migration: every hand-rolled `<select>`,
  search box, tab bar, and empty/error state in the Products screens now
  uses the shared `@dbk/ui` library. A genuine duplicate `Dialog` (built in
  this sprint, independently of a separate "Sprint 0.5" component-library
  effort that built its own, more complete one) was found and retired.
- **Phase 3** — Buyer PDP polish: gallery zoom, a sticky mobile
  Add-to-Cart bar (a real, separate component — not a duplicate of the
  purchase panel), Related Products (a real same-category query, not a
  fabricated recommendation).
- **Phase 4** — Creator Dashboard completion: drag-and-drop image upload
  and reordering (with a keyboard-accessible fallback), autosave, live
  preview, Duplicate Product, Bulk Actions.
- **Phase 5** — Backend review: found and fixed a total absence of
  structured logging in the Products/Creators/Users modules (only Auth had
  any), and a genuinely swallowed error whose comment claimed it was
  logged when it wasn't.
- **Phase 6** — Realistic Indian handmade-marketplace demo data (8
  categories, 8 creators/stores, 18 products, 23 variants, 5 buyers), only
  for tables that actually exist in the schema.
- **Phase 7** — Full validation, this time run against a real local
  PostgreSQL instance installed specifically for this pass (previous
  rounds could only compile/typecheck against the schema, not execute
  against live data).
- **Phase 8** — `docs/testing/sprint-01-production.md`, every test with
  Purpose/Steps/Expected Result/Pass-Fail, several marked `[verified live]`
  where this session actually exercised them.
- **Phase 9** — README/CHANGELOG updates covering all of the above.
- **Phase 10/11/12** — UI/UX, Security, and Performance reviews — see
  dedicated sections below.

### The most significant finding of this pass
Installing a real database to verify Phase 6's seed data surfaced a
**critical, previously undetectable bug**: `database/migrations/meta/
_journal.json` only listed the initial migration. `0001_sprint01_products_
soft_delete.sql` — the file adding `products.deleted_at` — had **never
actually been applied**, on any database anyone had run these migrations
against with this repository state, despite the `.sql` file itself being
correct and present. This had been invisible in every prior round of
validation because none of them had a live database to run migrations
against — `tsc`/`eslint`/`next build` all succeed regardless of whether a
migration file is tracked in the journal. Fixed and verified for real:
dropped/recreated the database, re-ran migrations (both now apply, column
confirmed via `psql`), ran both seed scripts, and confirmed live API
behavior (search, sort, pagination, product detail with working image
URLs) against real seeded data.

---

## 2. UI/UX Review Report (Phase 10)

Scope of this pass: the Products-related screens touched by Sprint 01 and
this hardening pass (not a redesign of screens outside that scope, per the
brief's explicit "do not redesign branding" instruction).

**Improved, concretely, this pass:**
- **Consistency**: every filter/sort/search control in the Products
  screens now shares the same underlying components as the rest of the
  app, instead of five different one-off implementations of the same
  interaction pattern.
- **Hierarchy & spacing**: unaffected by this pass beyond what the
  component migration itself changed — the design-token-based spacing
  scale (`--space-*`) was already consistently applied in Sprint 01 and
  remains so.
- **Micro-interactions**: drag-and-drop image reordering, autosave status
  transitions (Unsaved → Saving → Saved), live preview updating on
  keystroke, hover-reveal reorder/delete controls on gallery images.
- **Accessibility**: fixed one real `jsx-a11y/label-has-associated-control`
  error introduced by this pass's bulk-select checkbox; added
  keyboard-only Move-earlier/Move-later buttons specifically because
  drag-and-drop alone fails WCAG 2.1's operability requirement for
  pointer-only interactions; the sticky mobile CTA and gallery zoom both
  use accessible labels and the shared `Dialog`'s existing focus-trap
  behavior.
- **Loading/empty/error UX**: standardized onto `EmptyState`/`ErrorState`
  everywhere they weren't already, so retry affordances and empty-state
  messaging are now consistent instead of each screen inventing its own.
- **Mobile UX**: the new sticky Add-to-Cart bar specifically targets the
  common commerce problem of the primary CTA scrolling out of view on long
  product pages; it's `lg:hidden` so it doesn't duplicate the always-visible
  desktop panel.

**Explicitly not done, and why:** a page-by-page audit of screens this
sprint didn't touch (buyer account/order pages, creator analytics,
marketing pages) would be a much larger, separate UI/UX sprint — doing it
shallowly here risks introducing regressions in screens that weren't
otherwise part of this pass's verified scope.

---

## 3. Security Review Report (Phase 11)

Reviewed the Products module and its immediate dependencies. Findings:

| Area | Finding |
|---|---|
| Input validation | Every endpoint validates via Zod before touching the database; confirmed no route skips this. |
| SQL injection | All `sql` tagged-template usage in `repository.ts` uses Drizzle's parameterization (`${value}` is bound, not string-concatenated) — checked every occurrence, none build a query via string concatenation. |
| XSS | No `dangerouslySetInnerHTML` anywhere in the frontend workspace (checked). |
| Authorization | Every creator-scoped route re-checks ownership/permission per request (`authorizeOwnerOrPermission`) — no route trusts a cached or client-asserted role. |
| Rate limiting | Confirmed present on every Sprint 01 mutating route; auth endpoints use a dedicated `'auth'` tier keyed by IP+email (login) or IP alone (register/forgot-password) — real brute-force protection, not just a generic limit. |
| Error exposure | `shared/middleware/error-handler.ts` never returns a stack trace or raw exception message to the client — confirmed by reading the actual mapping code, not just the doc comment. |
| Secrets | No hardcoded secrets found in source (checked for common patterns); `.env.local` is gitignored; the demo-seed password is clearly documented as non-production. |
| Security headers | HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and a restrictive Permissions-Policy are all set in `next.config.ts` for every route. No CSP header is set — acceptable for this API-only backend (the one HTML page, `/api/docs`, has no user-controlled input rendered into it), but worth adding if the surface grows. |
| CORS | No CORS headers configured — correct, not a gap: the architecture is BFF-only (frontend Route Handlers call the backend server-to-server; browsers never call it cross-origin directly), so CORS doesn't apply. |
| File upload validation | `requestProductMediaUploadSchema` validates content-type (allowlist) and size (10MB cap) server-side, not just in the frontend's pre-upload check — confirmed the frontend check is a UX nicety, not the actual security boundary. |
| Swagger security | `/api/docs`/`/api/openapi.json`/`/api/openapi.yaml` are intentionally unauthenticated (API documentation, not a data endpoint) and expose no secrets — reviewed the spec content itself for anything sensitive; found none. |

**No new vulnerabilities requiring a code fix were found this pass** — the
existing security posture (built during Sprint 01 itself) held up under
review. The one carried-over finding remains the auth-bridge gap (see
CHANGELOG/README), which is an availability/architecture gap, not a
vulnerability — the backend correctly rejects requests it can't verify
rather than accepting a forged or unverifiable credential.

---

## 4. Performance Review Report (Phase 12)

| Area | Finding |
|---|---|
| N+1 queries | Reviewed every repository function; list/detail reads use `Promise.all` for independent parallel fetches, not per-row loops. The one loop found (`createProduct`'s per-variant insert) is bounded by variant count (typically 1-5) and runs inside a single transaction — not a meaningful concern at this scale. |
| Indexes | `products` has indexes on `(storeId, status)`, `(status, primaryCategoryId)`, `createdAt`, and `deletedAt`; `productVariants` and `productMedia` are indexed on their foreign keys. |
| **Price sort/filter — a real, documented gap** | `minPrice`/`maxPrice` filtering and `priceLow`/`priceHigh` sorting use a correlated subquery (`SELECT MIN(price) FROM product_variants WHERE product_id = ...`) with no supporting index. At current (demo) data volumes this is invisible; at real catalog scale it would mean a per-row subquery execution for every listing request using a price filter or sort. **Recommendation for the next sprint**: denormalize a `minPriceAmount` column onto `products`, maintained on variant insert/update, with its own index — turning this into a normal indexed sort/filter. Not fixed in this pass: it's a schema change with real migration/backfill implications, better done deliberately than squeezed into a review pass. |
| Frontend bundle/code splitting | Next.js App Router's per-route code splitting applies automatically; no manual `dynamic()` splitting was added or found necessary for the Products screens specifically. |
| Images | `next/image` used throughout the buyer gallery (automatic responsive sizing, lazy loading below the fold); the creator gallery's admin-only thumbnail grid uses plain `<img>` deliberately (documented inline — arbitrary uploaded-image hosts, not worth `next/image`'s `remotePatterns` config for an internal tool). |
| React Query caching | Buyer product listing seeds its cache from the server-rendered first page (no redundant client fetch on mount); creator product list/detail queries are invalidated precisely (by list or by specific detail key), not broadly, on every mutation. |
| Database round-trips | Product detail fetches variants and media in parallel (`Promise.all`), not sequentially. |

---

## 5. Demo Credentials

Every account seeded by `pnpm run db:seed:demo` shares the password
`DemoPass123!` (not a production credential — documented here and in
`backend/README.md`/`CHANGELOG.md`).

**Creators** (each owns one ACTIVE store with 2-3 published products):
`meera.krishnan@example.com`, `arjun.malhotra@example.com`,
`priya.nair@example.com`, `rohan.deshpande@example.com`,
`ananya.iyer@example.com`, `kabir.singh@example.com`,
`fatima.sheikh@example.com`, `vikram.rathore@example.com`

**Buyers** (no store): `aditya.rao@example.com`, `sneha.pillai@example.com`,
`karan.mehta@example.com`, `divya.reddy@example.com`,
`ishaan.kapoor@example.com`

---

## 6. Exact commands to verify everything locally

```bash
# Backend
cd backend
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test

# Database (requires a running Postgres — see backend/README.md's
# Environment Variables section for DATABASE_URL and everything else)
pnpm run db:migrate
pnpm run db:seed          # required — RBAC catalog
pnpm run db:seed:demo     # optional — realistic demo data

# Run it
pnpm run dev               # http://localhost:3000
curl http://localhost:3000/api/v1/health/ready
curl http://localhost:3000/api/docs                 # Swagger UI
curl http://localhost:3000/api/openapi.json

# Frontend
cd frontend
npm install
npm run lint
npm run typecheck
npm run build   # see Known Issues — blocked in network-restricted sandboxes only
```

**Swagger URL** (once the backend is running): `http://localhost:3000/api/docs`
**Seed command**: `pnpm run db:seed && pnpm run db:seed:demo`
**Migration command**: `pnpm run db:migrate`
**Database reset command**: see `backend/README.md`'s Database Reset recipe
(drops and recreates the public schema, then re-migrates and re-seeds).

---

## 7. Validation results (this session)

All run fresh, in order, this session:

| Check | Result |
|---|---|
| `pnpm install` (backend) | PASS |
| `pnpm lint` (backend) | PASS |
| `pnpm typecheck` (backend) | PASS |
| `pnpm build` (backend, with a real database connected) | PASS |
| `pnpm test` (backend) | PASS — 25/25 |
| Real Postgres migration + both seed scripts | PASS — verified via `psql` and live API calls |
| `npm install` (frontend) | PASS |
| `npx turbo run lint` (frontend, all 8 packages) | PASS — 0 errors |
| `npx turbo run type-check` (frontend, all 8 packages) | PASS — 0 errors |
| `npm run build` (frontend) | **BLOCKED — environment-specific, see Known Issues** |

---

## 8. Known Issues

1. **Frontend `npm run build`** fails only because this sandbox's network
   egress blocks `fonts.googleapis.com` (`403 host_not_allowed`, confirmed
   via direct `curl`, not inferred). `next/font/google` usage in both
   apps' `layout.tsx` is standard and correct; this will build successfully
   anywhere with normal internet access. No workaround file was
   introduced.
2. **Auth bridge gap** (carried over, not introduced this pass): the
   frontend's Better Auth session and the backend's JWT `authenticate()`
   middleware are unbridged. Every creator Products BFF route detects this
   and fails loudly (`501 AUTH_BRIDGE_NOT_CONFIGURED`) rather than faking
   success. Top priority for the next sprint.
3. **Price sort/filter has no supporting index** (Performance Review,
   above) — fine at demo scale, a real concern at production catalog
   scale. Recommended fix documented above, not applied this pass.
4. **No `InventoryTransaction` audit ledger** — inventory adjustments are
   correctly delta-based but only logged, not persisted as an auditable
   row, until that table is built (deferred per `backend/SCOPE.md`).
5. **Wishlist, guest Cart persistence, and Collections** have no backend
   support — pre-existing gaps, not regressions, documented in `CHANGELOG.md`.
6. **No endpoint to edit a variant's price/SKU after creation** — the
   creator Edit page correctly shows variants read-only rather than
   pretending this is supported.
7. `npm audit`: vulnerabilities pre-existing in the frontend dependency
   tree, not investigated this pass (flagged for visibility, not silently
   ignored).

---

## 9. Next recommended sprint

1. **Auth bridge** — the single highest-leverage fix; unblocks real
   end-to-end verification of everything creator-side.
2. **Price-sort index** (Performance Review) before catalog size grows.
3. Run `docs/testing/sprint-01-production.md` in full against a real
   staging environment with normal internet access.
4. Variant post-creation editing, if needed before a customer-facing
   launch.
5. `InventoryTransaction` audit ledger.
