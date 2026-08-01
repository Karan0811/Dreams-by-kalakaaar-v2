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
