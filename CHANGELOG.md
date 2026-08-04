# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/).

## Sprint 01 — Products Module

### Added — Backend

- **Search, filters, sort, pagination** on both public (`GET /v1/products`)
  and creator-scoped (`GET /v1/stores/{storeId}/products`) listings:
  free-text search (`q`), category/store/productType filters, price-range
  filter, in-stock-only filter, and five sort options. `newest`/`oldest`
  use keyset-cursor pagination (unchanged from before); `priceLow`/
  `priceHigh`/`bestSelling` use page-number pagination instead, since they
  order by a computed column outside the cursor's tuple — a deliberate,
  documented trade-off (see `productSortSchema` in
  `backend/src/modules/products/schemas.ts`).
- **Soft delete**: `DELETE /v1/stores/{storeId}/products/{productId}` sets
  a new `deletedAt` column; every repository read now filters it out.
  Distinct from the existing `ARCHIVED` status (reversible; soft delete is
  not).
- **Product Images**: two-step presigned-upload flow using Cloudflare R2
  (`POST .../media/upload-url`, then `POST .../media` to confirm/attach),
  plus `PATCH`/`DELETE .../media/{id}` to reorder/re-caption/remove. First
  real consumer of `shared/storage/r2-client.ts`.
- **Inventory Management**: `PATCH .../variants/{variantId}/inventory`
  applies a signed delta against the current row, never a raw overwrite.
- **OpenAPI / Swagger**: `GET /api/docs` (Swagger UI), `GET /api/openapi.json`,
  `GET /api/openapi.yaml`, all served from one `openapi/v1.yaml` source of
  truth, documenting every endpoint above plus the pre-existing surface.
- `GET /v1/creator/application` now also returns `storeId`/`storeSlug`/
  `storeStatus` — previously nothing exposed this relationship on a read
  path, so the frontend had no way to discover which store to manage.

### Added — Frontend (Buyer)

- Real search box, price-range filter, in-stock toggle, and corrected sort
  dropdown on `/products`, wired to the backend's actual query contract.
- Explicit error state with retry, alongside the existing empty state and
  skeleton loader.

### Added — Frontend (Creator)

- **My Products** (`/dashboard/products`): status filter tabs, search,
  delete confirmation, empty/loading/error states.
- **Create Product** (`/dashboard/products/new`): variant-aware form with
  validation matching the backend's Zod schemas field-for-field, and an
  unsaved-changes warning.
- **Edit Product** (`/dashboard/products/{id}/edit`): basic-info form,
  publish/pause/archive/delete, per-variant inventory adjustment, image
  gallery with upload/delete, and a read-only buyer-preview card.
- New `Dialog` UI primitive (Radix, previously an unused dependency).

### Fixed

- `findMediaForProduct` never joined the `media` table, so product
  responses never actually included an image URL — found while wiring up
  the creator image gallery, which depends on it.
- `pnpm install` was silently exiting 1 on every fresh install
  (`ERR_PNPM_IGNORED_BUILDS`) — pnpm 11 requires an explicit `allowBuilds`
  entry in `pnpm-workspace.yaml`, which the repo never had.
- The OpenAPI spec lived outside `backend/` entirely (`api/openapi/v1.yaml`
  at the repo root), contradicting the documented architecture and making
  it unservable if `backend/` is deployed as its own Vercel root. Relocated
  to `backend/openapi/v1.yaml`.
- `npm run lint` failed outright, for every package, for several
  independent reasons predating this sprint: five shared packages had no
  `eslint.config.mjs` at all; `@dbk/config`'s own eslint config imported
  plugins it never declared as dependencies; `@typescript-eslint/no-unused-vars@8.65.0`
  crashes on any zero-parameter function type (`() => void`, used
  throughout this codebase's error boundaries); and a 3-level relative
  `extends` path in the shared tsconfig broke `eslint-import-resolver-typescript`
  through the npm workspace symlink. All fixed; see commit history for the
  full breakdown of each.
- `better-auth`'s client method is `requestPasswordReset`, not
  `forgetPassword`/`forgotPassword`, which the code called — broken by an
  unpinned `^1.1.10` dependency range resolving forward.
- React 19.2's stricter `onInput` typing broke `Textarea.tsx`.
- Several pre-existing `react/no-unescaped-entities` and one
  `jsx-a11y/label-has-associated-control` issue, surfaced once lint could
  run at all.

### Known limitations (see docs/testing/sprint-01-products.md for detail)

- **Auth bridge gap**: the frontend's Better Auth session and the backend's
  JWT-based `authenticate()` middleware are not yet bridged. Every creator
  Products BFF route detects this and returns an explicit
  `501 AUTH_BRIDGE_NOT_CONFIGURED` rather than a fake success. This
  predates Sprint 01 and also affects the existing dashboard
  pending-actions/performance widgets.
- Categories, Collections, Tags, and full SEO fields remain deferred per
  `backend/SCOPE.md` — not part of this sprint's staged scope.
- No endpoint exists to edit a variant's price/SKU after creation (only at
  creation time); the creator Edit page shows variants read-only alongside
  a separate inventory-adjustment control rather than pretending this is
  supported.
- A full `InventoryTransaction` audit ledger is deferred; inventory
  adjustments are correctly delta-based (never a lost-update overwrite) but
  don't yet persist a per-adjustment audit row.

## Sprint 01 Hardening Pass

Continuation of Sprint 01: reusable-component migration, Creator Dashboard
feature completion, a backend review pass, realistic demo data, and a
critical database bug found and fixed while verifying it.

### Fixed — critical

- **Migration `0001_sprint01_products_soft_delete` had never actually been
  applying, anywhere.** `database/migrations/meta/_journal.json` — the
  file drizzle-kit's migrator reads to know which migration files exist —
  only listed `0000_init`. The `.sql` file itself was correct and present;
  the journal entry pointing to it was missing, silently, on every database
  anyone had run these migrations against with this repository state.
  Found by installing a real local Postgres to verify this pass's seed
  data, which surfaced the missing `deleted_at` column immediately. Fixed
  and verified for real: dropped/recreated the database, re-ran migrations
  (both now apply), ran the seed scripts, and confirmed `GET /v1/products`
  — search, sort, pagination, and product detail with images — all correct
  against live data.

### Added — Backend

- Structured logging (the existing `shared/observability/logger.ts`
  infrastructure, previously used only by the auth module) added at every
  real Products mutation: creation, status transitions (publish-readiness
  failures logged at `warn`), soft delete, and inventory adjustments (the
  only audit trail until the InventoryTransaction ledger exists).
- `GET /v1/creator/application` — no functional change, but its OpenAPI
  documentation was expanded to describe the `storeId`/`storeSlug`/
  `storeStatus` fields Sprint 01 added.
- `src/scripts/seed-demo-data.ts`: realistic Indian handmade-marketplace
  demo data — 8 categories, 8 creators/stores (real craft descriptions,
  cities, taglines), 18 products across 23 variants with real inventory
  quantities and real Unsplash photography (not placeholder gray boxes), 5
  buyer accounts. Every seeded account has a real Argon2id password hash
  and can actually log in (`DemoPass123!`). Idempotent — safe to re-run.
  Deliberately does not seed Collections/Tags/Reviews/Wishlist/Cart/Orders/
  Addresses, since none of those tables exist in the schema yet.

### Fixed — Backend

- `deleteProductMedia`'s R2 cleanup comment claimed a storage-delete
  failure "is logged by the R2 client's caller-level error handling"; the
  actual code was `.catch(() => undefined)` — silently swallowed, nothing
  logged anywhere. Now actually logs it.

### Added — Frontend (Phase 2: reusable-component migration)

- Buyer `/products`: native `<select>` → `Select`, hand-rolled search box
  → `SearchInput`, hand-rolled empty/error blocks → `EmptyState`/
  `ErrorState`.
- Creator My Products: hand-rolled tab buttons → `Tabs`, same
  SearchInput/EmptyState/ErrorState migration.
- Creator Create Product: native `<select>` for product type → `Select`.
- Retired this sprint's own `packages/ui/src/primitives/Dialog.tsx` in
  favor of a more complete `Dialog` + `ConfirmDialog` built in a separate,
  parallel "Sprint 0.5" effort — a genuine duplicate found while
  reconciling the two, not present until this pass. Migrated both
  hand-rolled delete-confirmation dialogs onto `ConfirmDialog`.

### Added — Frontend (Phase 3: Buyer PDP polish)

- Gallery zoom: click the main product image to open a larger view in the
  shared `Dialog`.
- Sticky mobile Add-to-Cart bar: a separate, minimal component (not a
  duplicate of the full purchase panel — that would mean two live copies of
  the same customization form and duplicate field ids). Adds directly for
  simple products; scrolls to the real panel when customization is
  required.
- Related Products: a real, server-rendered section querying the same
  category, excluding the current product. There's no recommendation
  engine (a genuinely separate feature), so this uses the one real signal
  already available rather than fabricating a fake "similar items" result.

### Added — Frontend (Phase 4: Creator Dashboard completion)

- Drag-and-drop image upload (in addition to the existing file picker) and
  drag-and-drop reordering, with keyboard-accessible Move-earlier/
  Move-later buttons as a non-pointer alternative — dragging alone isn't
  operable without a mouse or touch.
- Autosave on the Edit page: debounced 1.5s after the last keystroke, only
  persists once the current values pass validation. A status indicator
  (Unsaved changes / Saving… / All changes saved) replaces the old
  disabled-until-dirty Save button.
- Live Preview: title/description changes flow to the preview card on
  every keystroke, independent of the debounced autosave.
- Duplicate Product: composes existing fetch-detail + create calls (no
  dedicated backend endpoint exists) — copies title/description/type/
  variants, not photos or SKUs, and starts stock at 0.
- Bulk Actions: multi-select archive/delete on the My Products list, with
  `Promise.allSettled`-based hooks that report partial failure rather than
  silently succeeding if some (not all) requests fail.

### Known limitations, in addition to the ones already listed above

- Wishlist has no backend support (no `wishlists` table); the buyer PDP's
  "Save" button shows a toast but persists nothing. Pre-existing, not
  introduced by this sprint.
- Guest (unauthenticated) cart is not persisted — `/api/cart` returns an
  empty shape for guests. Pre-existing, flagged inline in
  `apps/buyer/app/api/cart/route.ts`.
- Collections are not implemented (no table, no endpoint) — deferred per
  `backend/SCOPE.md`.
