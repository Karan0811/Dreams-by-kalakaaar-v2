# @dbk/utils

Cross-cutting, product-agnostic helpers shared by every app and package in
this monorepo. Anything that needs `@dbk/types`' shared types (`Money`,
`PaginatedResponse`, etc.) can depend on them — `@dbk/utils` already lists
`@dbk/types` as a dependency, and `@dbk/types` has no dependencies of its
own, so there's no circularity to worry about.

## Why there's no `packages/shared`

An earlier brief for this sprint described a `packages/shared` package with
examples (API response types, error classes, logger, pagination/search
helpers, formatters, validators, constants, enums). Nearly all of that
already exists across `@dbk/types` (response/error envelope shapes, domain
types) and `@dbk/utils` (formatters, zod schemas, `cn()`, error copy). This
sprint extended those two existing packages with the pieces that were
actually missing, rather than standing up a third package that would
duplicate what's already here. If there's a concrete reason to split
`utils` into a separate `shared` package later (e.g. a bundle-size or
ownership boundary that doesn't exist today), that's a follow-up
refactor — flag it and it can be scoped properly rather than doing it
implicitly as a side effect of this sprint.

## New this sprint

- **`errors.ts`** — `AppError`, `ValidationError`, `NotFoundError`: generic
  client-side/business-rule error classes, for failures that happen
  *before* a request is made (e.g. `validateImageUpload` rejecting an
  oversized file). Distinct from `@dbk/api-client`'s `ApiError`, which wraps
  a server response's error envelope — the two don't import each other.
- **`logger.ts`** — a minimal leveled `logger.debug/info/warn/error`. Not a
  replacement for the OpenTelemetry/Sentry stack (`18-observability-and-monitoring.md`)
  — use that for anything that needs to be queried or alerted on.
- **`pagination.ts`** — `hasNextPage`, `flattenPages`, `isLastPage`,
  `clampPage`: read either pagination envelope shape from `@dbk/types`;
  never construct one (that stays server-side).
- **`search.ts`** — `debounce`, `buildQueryParams`: a generic query-string
  builder. Products' own `buildFilterParams` in `@dbk/api-client` is
  domain-specific and owned by the Products module — this is the generic
  base a future module's equivalent helper can build on, not a replacement
  for it.
- **`slug.ts`** — `slugify`: for client-side slug *previews* (e.g. a
  Creator Product form showing the URL as the title is typed). Real product
  slugs are still assigned server-side.
- **`file.ts`** — `formatFileSize`, `getFileExtension`,
  `validateImageUpload`: pre-flight checks for the Creator's Image Upload
  UI, run before a file is sent to R2.
- **`image.ts`** — `aspectRatioToPaddingTop`, `DEFAULT_BLUR_DATA_URL`: pure
  math/constants consumed by `@dbk/ui`'s `Image` component.
- **`validators.ts`** — `isValidSlug`, `isValidUrl`, `isNonEmptyString`,
  `clamp`: plain-function checks for imperative code paths outside a
  react-hook-form + zod flow. Form field validation still belongs in
  `validation/shared-schemas.ts` / `validation/auth-schemas.ts` — don't
  duplicate those rules here.
- **`constants.ts`** — `BREAKPOINTS_PX`, `DEFAULT_PAGE_SIZE`,
  `DEFAULT_DEBOUNCE_MS`, `MAX_UPLOAD_FILE_SIZE_BYTES`,
  `ALLOWED_IMAGE_MIME_TYPES`, `MAX_PRODUCT_IMAGES`. `BREAKPOINTS_PX` mirrors
  Tailwind's default breakpoints by hand — there's no automated sync
  between the CSS tokens and this file, so a breakpoint change means
  updating both.

All new modules are re-exported from `src/index.ts`, tree-shakeable like
the existing ones (no barrel-only default export, no side effects at
import time).

## Sprint 0.75 additions

Extended `image.ts` (browser-only, unlike the pure-math helpers already in
that file) with:

- **`readImageDimensions(file)`** / **`validateImageDimensions(file, {minWidth, minHeight, maxWidth, maxHeight})`** — decodes a `File` to read/validate its pixel dimensions, throwing `ValidationError` on failure.
- **`compressImage(file, {maxWidth?, quality?})`** — canvas-based client-side JPEG re-encode for upload size reduction. Lossy — don't use where original bytes must be preserved.

Both are for client-side upload flows only (`@dbk/ui`'s `useFileUpload`),
never Server Components/Route Handlers.
