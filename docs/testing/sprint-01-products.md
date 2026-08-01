# Sprint 01 — Products Module: Manual Testing Checklist

This is a manual verification checklist for a real environment (a live
Postgres database, Redis, and R2 bucket) — the sandbox this sprint was
built in has neither a live database nor unrestricted network access, so
these boxes reflect what's *implemented and code/type/lint-verified*, not
what's been clicked through in a browser against live infrastructure. See
`DEVELOPMENT_STATUS.md` for exactly what was and wasn't runtime-verified.

**Before testing the creator flows below**: the auth-bridge gap
(`frontend/packages/auth/src/access-token.ts`) means every creator Products
BFF route will currently return `501 AUTH_BRIDGE_NOT_CONFIGURED` until a
real bearer-token bridge is implemented. Backend endpoints themselves can
be tested directly against the REST API (e.g. via `/api/docs` Swagger UI or
curl) independent of that gap.

---

## Backend

### Product CRUD
- [ ] `POST /v1/stores/{storeId}/products` creates a product with variants + inventory rows, as the store owner
- [ ] `POST` as a non-owner, non-permitted user → 403
- [ ] `POST` with an invalid body (missing title, empty variants array) → 422 with field-level `details`
- [ ] `GET /v1/stores/{storeId}/products/{productId}` returns the product with variants and media
- [ ] `PATCH .../{productId}` updates title/description/leadTimeDays/primaryCategoryId
- [ ] `GET /v1/products/{idOrSlug}` (public) resolves by both UUID and slug
- [ ] `GET /v1/products/{idOrSlug}` for a DRAFT/PAUSED product → 404 (public listing is ACTIVE-only)

### Draft / Publish
- [ ] New product starts as `DRAFT`
- [ ] `PATCH .../{productId}` with `{"status":"ACTIVE"}` on a product with zero photos → 422, readiness-check message
- [ ] Same with a variant missing an inventory row → 422
- [ ] Same with ≥1 photo and every variant having inventory → 200, status becomes `ACTIVE`
- [ ] `{"status":"PAUSED"}` from `ACTIVE` → 200
- [ ] `{"status":"ARCHIVED"}` from any non-deleted status → 200, `archivedAt` set

### Soft Delete
- [ ] `DELETE .../{productId}` → 204
- [ ] Deleted product no longer appears in `GET /v1/stores/{storeId}/products` (any status filter)
- [ ] Deleted product's public URL → 404
- [ ] `DELETE` an already-deleted product → 404 (not a silent no-op)

### Product Images
- [ ] `POST .../media/upload-url` returns a presigned URL + `mediaId`
- [ ] `PUT` the file bytes directly to the returned URL succeeds
- [ ] `POST .../media` with that `mediaId` + alt text attaches it; response includes `publicUrl`
- [ ] `GET` the product afterward includes the image with a working `publicUrl` (this is the media-join fix — confirm it didn't regress)
- [ ] `isPrimary: true` on attach unsets any previous primary
- [ ] `PATCH .../media/{id}` reorders / re-captions / re-primaries
- [ ] `DELETE .../media/{id}` removes it from the gallery and best-effort deletes the R2 object
- [ ] Uploading a non-image content type → 422
- [ ] Uploading >10MB → 422

### Inventory Management
- [ ] `PATCH .../variants/{variantId}/inventory` with a positive `quantityDelta` increases stock
- [ ] Negative delta decreases stock, floored at 0 (never negative)
- [ ] `quantityDelta: 0` → 422 (must be non-zero)
- [ ] `lowStockThreshold` update applies independently of the delta

### Search / Filters / Sorting / Pagination
- [ ] `q=<keyword>` matches title or description (case-insensitive)
- [ ] `categoryId`, `storeId`, `productType` filters narrow results correctly
- [ ] `minPrice`/`maxPrice` filter on each product's cheapest variant
- [ ] `minPrice > maxPrice` → 422
- [ ] `inStockOnly=true` excludes products with zero in-stock variants
- [ ] `sort=newest` (default) and `sort=oldest` paginate via `cursor`/`nextCursor`
- [ ] `sort=priceLow`, `priceHigh`, `bestSelling` paginate via `page`/`pagination.totalPages` instead
- [ ] `limit` is respected and capped at 100

### Authorization
- [ ] Every creator-scoped route rejects a caller who doesn't own the store and lacks the fallback permission
- [ ] Every creator-scoped route with an unknown `storeId` → 404, not 403

### Validation
- [ ] Every Zod validation failure returns the standard error envelope (`code: "VALIDATION_ERROR"`, `details[]`, `correlationId`)

### OpenAPI / Swagger
- [ ] `GET /api/docs` renders Swagger UI and loads the spec from `/api/openapi.json`
- [ ] `GET /api/openapi.json` and `GET /api/openapi.yaml` both parse and describe every endpoint above
- [ ] "Authorize" (bearer token) works in the Swagger UI "Try it out" flow

---

## Buyer (frontend)

- [ ] `/products` server-renders a populated grid on first load (no client-side flash of empty state)
- [ ] Typing in the search box and submitting updates the URL and results
- [ ] Setting min/max price and blurring the field updates the URL and results
- [ ] Toggling "In stock only" updates results
- [ ] Each sort option (Newest, Oldest, Price ↑, Price ↓, Best Selling) returns correctly ordered results
- [ ] "Load more" works for both cursor-paginated and page-paginated sorts
- [ ] Empty state renders when a filter combination matches nothing
- [ ] Error state (with "Try again") renders if the API call fails, and retry works
- [ ] Product detail page (`/products/[slug]`) resolves by slug
- [ ] Responsive: 2 columns on mobile, 3 on tablet, 4 on desktop
- [ ] Keyboard: search input, price inputs, in-stock checkbox, and sort dropdown are all reachable and operable via keyboard alone

## Creator (frontend)

**Blocked on the auth-bridge gap for live verification — see note at top.**
Once a bearer token is available:

- [ ] `/dashboard/products` lists the signed-in creator's products only
- [ ] Status tabs (All/Draft/Active/Paused/Archived) filter correctly
- [ ] Search filters the list
- [ ] Empty state renders for a store with zero products, and for a filter with no matches
- [ ] "New Product" creates a product and redirects to its edit page
- [ ] Create form: validation errors render inline per field; adding/removing variants works; unsaved-changes warning fires on tab close and on Cancel
- [ ] Edit page: saving basic-info changes persists and shows a success state
- [ ] Edit page: Publish is disabled/fails with a clear message until ≥1 photo and all variants have inventory
- [ ] Edit page: Pause and Archive transition correctly and update the status badge
- [ ] Edit page: Delete asks for confirmation, then removes the product and redirects to the list
- [ ] Image gallery: upload succeeds, appears in the grid, primary badge shows correctly; delete removes it
- [ ] Image gallery: rejects non-image files and files over 10MB client-side before any network call
- [ ] Inventory panel: Add/Remove buttons adjust stock and reflect the new total; low-stock styling appears at/under threshold
- [ ] Preview card reflects the current title/price/primary image

---

## Regression (pre-existing functionality)

- [ ] Authentication: register, login, logout, forgot/reset password all still work (buyer)
- [ ] Buyer navigation, cart page, account dashboard render without error
- [ ] Creator dashboard (`/dashboard`), pending actions, performance widgets render without error
- [ ] Creator login (`/login`) and become-a-creator flow render without error
- [ ] All pre-existing backend endpoints (auth, users, creators, health) still respond as before — verified via a running server: `/api/v1/health` → 200, malformed `/api/v1/auth/register` → 422 (not 500), unauthenticated creator/store routes → 401, all before any database call, confirming middleware/validation/auth layers are intact independent of database connectivity
- [ ] Shared UI components (`Button`, `Card`, `Input`, `Checkbox`, `Label`, `Badge`, `Alert`, `Skeleton`) render correctly in both old and new usages
- [ ] `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` all pass in `backend/`
- [ ] `npm install`, `npm run lint`, `npm run typecheck` all pass in `frontend/`; `npm run build` is blocked only by this environment's network restriction on Google Fonts (see `DEVELOPMENT_STATUS.md`) — verify in an environment with normal internet access
