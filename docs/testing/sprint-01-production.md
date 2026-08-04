# Sprint 01 — Production Testing Guide

Run this against a real environment: a live Postgres database (migrated +
seeded — see the Database Migration/Seed Guides in `DEVELOPMENT_STATUS.md`),
normal internet access, and a deployed or locally-running instance of both
apps. Every box below was traceable to real, working code as of this
sprint — see `CHANGELOG.md` for what backs each item and
`DEVELOPMENT_STATUS.md` for exactly what was and wasn't runtime-verified in
the sandbox this was built in (which has neither a persistent live database
by default nor unrestricted network access — this session installed a
temporary local Postgres specifically to verify the items marked
**[verified live]** below; that instance does not persist between sessions).

Legend: **[verified live]** = actually exercised against a real running
server + real Postgres this session. Everything else needs to be run for
real in your environment; this document is the checklist for that, not a
claim that every box is already checked.

---

## Backend

### Authentication

**Register**
- Purpose: confirm a new buyer account can be created with a valid email/password.
- Steps: `POST /v1/auth/register` with `{email, password, displayName, acceptedTerms: true}` for a new email.
- Expected Result: `201`, response includes the created user; a row exists in `users` with `status: PENDING_EMAIL_VERIFICATION`.
- Pass/Fail: [ ]

**Register — validation**
- Purpose: confirm malformed input never reaches the database.
- Steps: `POST /v1/auth/register` with an empty body. **[verified live this session — 422]**
- Expected Result: `422 VALIDATION_ERROR` with field-level `details[]`, before any DB write.
- Pass/Fail: [x] (verified this session)

**Login**
- Purpose: confirm a registered user can authenticate and receive tokens.
- Steps: `POST /v1/auth/login` with a seeded demo account's email + `DemoPass123!` (see Demo Credentials in `DEVELOPMENT_STATUS.md`).
- Expected Result: `200`, response body includes `accessToken`; an httpOnly refresh-token cookie is set (`Path=/v1/auth`).
- Pass/Fail: [ ]

**Logout**
- Purpose: confirm the refresh token is revoked and can't be reused.
- Steps: log in, then `POST /v1/auth/logout` with the session's cookie, then attempt `POST /v1/auth/refresh` with the same (now-revoked) cookie.
- Expected Result: logout returns `200`; the subsequent refresh attempt returns `401`.
- Pass/Fail: [ ]

**Refresh**
- Purpose: confirm a valid refresh token rotates into a new access token.
- Steps: log in, then `POST /v1/auth/refresh` with the refresh-token cookie.
- Expected Result: `200` with a new `accessToken`; the old refresh token is now invalid (rotation).
- Pass/Fail: [ ]

**Forgot Password**
- Purpose: confirm a reset request doesn't leak whether an email exists.
- Steps: `POST /v1/auth/forgot-password` with a known seeded email, then again with an unknown email.
- Expected Result: both return the same `200`-style response; only the known-email case actually creates a `password_resets` row.
- Pass/Fail: [ ]

**Reset Password**
- Purpose: confirm a valid reset token changes the password and the old one stops working.
- Steps: request a reset, retrieve the token (dev: from logs/DB, since email delivery isn't part of this sprint), `POST /v1/auth/reset-password`, then try logging in with the old password.
- Expected Result: reset succeeds; login with the old password fails; login with the new password succeeds.
- Pass/Fail: [ ]

**Email Verification**
- Purpose: confirm the verification link transitions a user out of `PENDING_EMAIL_VERIFICATION`.
- Steps: register a new account, retrieve the verification token, `POST /v1/auth/verify-email`.
- Expected Result: `200`; the user's `status` becomes `ACTIVE` and `emailVerified: true`.
- Pass/Fail: [ ]

**Creator Application**
- Purpose: confirm applying creates a Creator + Store together and grants the Creator Team Owner role.
- Steps: log in as a buyer, `POST /v1/creator/apply` with legal name/category, then `GET /v1/creator/application`.
- Expected Result: `201` on apply; the GET response includes `storeId`/`storeSlug`/`storeStatus` (Sprint 01 addition — previously absent entirely).
- Pass/Fail: [ ]

### Product CRUD

**Create**
- Purpose: confirm a product with variants is created with each variant's inventory row.
- Steps: as a store owner, `POST /v1/stores/{storeId}/products` with title/description/variants[].
- Expected Result: `201`; the product is `DRAFT`; each variant has a matching `inventory` row (confirmed via the transaction in `createProduct`).
- Pass/Fail: [ ]

**Read**
- Purpose: confirm both owner-side and public detail reads return variants + media.
- Steps: `GET /v1/stores/{storeId}/products/{productId}` (owner) and `GET /v1/products/{slug}` (public, ACTIVE only). **[verified live this session]**
- Expected Result: both return the product with `variants[]` and `media[]` populated, media including a working `publicUrl`.
- Pass/Fail: [x] (verified this session against seeded data)

**Update**
- Purpose: confirm title/description/leadTimeDays/category update correctly.
- Steps: `PATCH /v1/stores/{storeId}/products/{productId}` with a field change.
- Expected Result: `200`, the field is updated, `updatedAt` changes.
- Pass/Fail: [ ]

### Draft / Publish

**Publish blocked without a photo**
- Purpose: confirm the publish-readiness check is enforced.
- Steps: `PATCH` a photo-less DRAFT product with `{"status":"ACTIVE"}`.
- Expected Result: `422`, message lists "At least one product photo is required."
- Pass/Fail: [ ]

**Publish succeeds when ready**
- Purpose: confirm publish works once requirements are met.
- Steps: attach ≥1 photo, ensure every variant has inventory, retry the same PATCH.
- Expected Result: `200`, status becomes `ACTIVE`.
- Pass/Fail: [ ]

**Pause / Archive**
- Purpose: confirm the remaining status transitions work.
- Steps: `PATCH` with `{"status":"PAUSED"}` from ACTIVE, then `{"status":"ARCHIVED"}`.
- Expected Result: both `200`; ARCHIVED sets `archivedAt`.
- Pass/Fail: [ ]

### Delete

**Soft delete**
- Purpose: confirm delete is a real soft-delete, not a hard delete or no-op.
- Steps: `DELETE /v1/stores/{storeId}/products/{productId}`, then list the store's products (any status filter) and fetch the public slug.
- Expected Result: `204`; the product is absent from both; a second `DELETE` on the same id returns `404`.
- Pass/Fail: [ ]

### Variants

**Created only at product creation**
- Purpose: confirm this known, documented limitation holds (no endpoint exists to add/edit variants after creation).
- Steps: attempt to find any `PATCH`/`POST` route under `.../variants/{id}` other than `.../inventory`.
- Expected Result: none exists — this is intentional, not a bug (see `DEVELOPMENT_STATUS.md` Priority 2).
- Pass/Fail: [ ]

### Inventory

**Delta adjustment**
- Purpose: confirm adjustment is additive, never a raw overwrite.
- Steps: `PATCH .../variants/{variantId}/inventory` with `{"quantityDelta": 5}`, then again with `{"quantityDelta": -3}`.
- Expected Result: quantity increases by 5, then decreases by 3 (net +2 from the start); never settable to an arbitrary absolute number.
- Pass/Fail: [ ]

**Floors at zero**
- Purpose: confirm stock can't go negative.
- Steps: adjust a variant with `quantityDelta` larger in magnitude than its current stock (negative).
- Expected Result: `200`, `quantityAvailable` is `0`, not negative.
- Pass/Fail: [ ]

### Images

**Upload flow**
- Purpose: confirm the two-step presigned-upload + attach flow works end to end.
- Steps: `POST .../media/upload-url`, `PUT` the file to the returned URL, `POST .../media` with the returned `mediaId`.
- Expected Result: `201` on attach; the product's `media[]` now includes this image with a working `publicUrl` (Sprint 01 media-join fix).
- Pass/Fail: [ ]

**Reorder / delete**
- Purpose: confirm gallery management works.
- Steps: `PATCH .../media/{id}` with a new `displayOrder`, then `DELETE .../media/{id}`.
- Expected Result: order updates; delete removes it from the gallery and best-effort deletes the R2 object.
- Pass/Fail: [ ]

### Search / Filters / Sorting / Pagination

**Search**
- Purpose: confirm `q` matches title/description.
- Steps: `GET /v1/products?q=silver`. **[verified live this session]**
- Expected Result: only products with "silver" in title/description are returned.
- Pass/Fail: [x] (verified this session — correctly returned "Minimal Silver Stud Earrings" and "Hammered Silver Cuff")

**Filters**
- Purpose: confirm category/price/in-stock filters narrow results correctly.
- Steps: `GET /v1/products?minPrice=100000&maxPrice=200000`, `GET /v1/products?inStockOnly=true`.
- Expected Result: results respect both bounds; in-stock filter excludes zero-stock products.
- Pass/Fail: [ ]

**Sorting**
- Purpose: confirm all 5 sort options order correctly.
- Steps: `GET /v1/products?sort=priceLow`. **[verified live this session]**
- Expected Result: ascending price order.
- Pass/Fail: [x] (verified this session — Handmade Paper Notebook, ₹650, correctly first)

**Pagination**
- Purpose: confirm cursor pagination (newest/oldest) and page pagination (price/popularity sorts) both work.
- Steps: `GET /v1/products?sort=priceLow&limit=5`. **[verified live this session]**
- Expected Result: response includes `pagination.page`/`totalPages`/`totalCount`, not a cursor.
- Pass/Fail: [x] (verified this session — `page:1, totalPages:4, totalCount:18`)

### Authorization

**Non-owner rejected**
- Purpose: confirm a user who doesn't own a store (and lacks the fallback permission) can't manage its products.
- Steps: as User B, attempt `POST /v1/stores/{UserA'sStoreId}/products`.
- Expected Result: `403`.
- Pass/Fail: [ ]

**Unauthenticated rejected**
- Purpose: confirm every creator-scoped route requires a token.
- Steps: call any `.../stores/{id}/products...` route with no `Authorization` header. **[verified live this session]**
- Expected Result: `401`, before any database call.
- Pass/Fail: [x] (verified this session for creator/apply, creator/application, stores/.../products)

### Validation

**Field-level errors**
- Purpose: confirm every Zod failure returns the standard envelope.
- Steps: submit an invalid product body (e.g. `variants: []`).
- Expected Result: `422`, `code: "VALIDATION_ERROR"`, `details[]` naming the failing field, `correlationId` present.
- Pass/Fail: [ ]

### Swagger

**Docs load**
- Purpose: confirm the interactive API docs work.
- Steps: visit `/api/docs`. **[verified live this session]**
- Expected Result: Swagger UI renders, loads from `/api/openapi.json`.
- Pass/Fail: [x] (verified this session — 200, 23 documented paths)

**Try it out**
- Purpose: confirm the Authorize flow lets you actually call an endpoint from the UI.
- Steps: click Authorize, paste a bearer token, try `GET /v1/products`.
- Expected Result: a real response renders inline.
- Pass/Fail: [ ]

---

## Buyer

**Landing Page**
- Purpose: confirm the homepage renders without error.
- Steps: visit `/`.
- Expected Result: page loads; no console errors; featured content renders or shows its empty state if the backend has none yet.
- Pass/Fail: [ ]

**Product Listing**
- Purpose: confirm `/products` server-renders a populated grid.
- Steps: visit `/products` with JS disabled or via view-source.
- Expected Result: product cards are present in the initial HTML, not only after client hydration.
- Pass/Fail: [ ]

**Product Detail**
- Purpose: confirm the PDP renders gallery, price, creator info, description, and now Related Products.
- Steps: visit `/products/{slug}` for a seeded product.
- Expected Result: all sections render; clicking the main image opens the zoom dialog; "You might also like" shows same-category products if any exist.
- Pass/Fail: [ ]

**Category**
- Purpose: confirm category-scoped browsing works.
- Steps: visit `/categories/{slug}` (or the equivalent entry point in your build).
- Expected Result: only that category's products appear.
- Pass/Fail: [ ]

**Collection**
- Purpose: N/A — Collections are not implemented (no `collections` table or endpoint exists; deferred per `backend/SCOPE.md`).
- Steps: —
- Expected Result: not testable; not a regression.
- Pass/Fail: [ ] N/A

**Search**
- Purpose: confirm the buyer search box updates results and the URL.
- Steps: type a query into `/products`'s search box, submit.
- Expected Result: URL updates with `?q=...`; results filter accordingly; clearing the search restores the full list.
- Pass/Fail: [ ]

**Filters**
- Purpose: confirm price range and in-stock filters work in the UI.
- Steps: set min/max price, toggle "In stock only".
- Expected Result: results update; "Clear filters" appears and resets everything.
- Pass/Fail: [ ]

**Wishlist**
- Purpose: N/A — there is no backend Wishlist endpoint (no `wishlists` table exists). The "Save" button on a PDP shows a toast but does not persist anything server-side. This is a pre-existing, documented gap, not a Sprint 01 regression.
- Steps: —
- Expected Result: not testable as a real feature yet.
- Pass/Fail: [ ] N/A

**Cart**
- Purpose: confirm the cart page renders and basic add-to-cart works for the logged-in case; note the guest-cart gap.
- Steps: add an item to cart, visit `/cart`.
- Expected Result: item appears for a logged-in buyer. For a guest (unauthenticated) visitor, `/api/cart` returns an empty cart shape rather than persisting anything — documented, pre-existing gap (`apps/buyer/app/api/cart/route.ts`).
- Pass/Fail: [ ]

**Responsive**
- Purpose: confirm the buyer app works at mobile/tablet/desktop widths.
- Steps: resize to 375px, 768px, 1280px on `/products` and a PDP.
- Expected Result: grid reflows (2/3/4 columns), sticky mobile Add-to-Cart bar appears only below `lg`, no horizontal scroll or overlap.
- Pass/Fail: [ ]

**Accessibility**
- Purpose: confirm keyboard and screen-reader basics.
- Steps: tab through the PLP's search/filter/sort controls and a PDP's gallery/purchase panel using only the keyboard.
- Expected Result: every control is reachable and operable; focus is visible; the sort `Select`, price inputs, and in-stock checkbox all have accessible labels.
- Pass/Fail: [ ]

**Loading**
- Purpose: confirm loading states render before data arrives.
- Steps: throttle network to Slow 3G, visit `/products`.
- Expected Result: skeleton grid shows, then real content replaces it — no blank flash.
- Pass/Fail: [ ]

**Skeleton**
- Purpose: confirm skeletons match the eventual layout.
- Steps: same as above; compare skeleton shape to loaded content.
- Expected Result: skeleton card aspect ratio and count roughly match the real grid.
- Pass/Fail: [ ]

**Empty State**
- Purpose: confirm a no-results search shows a real empty state, not a blank grid.
- Steps: search for a nonsense string on `/products`.
- Expected Result: `EmptyState` renders with a "Clear filters" action.
- Pass/Fail: [ ]

**Error State**
- Purpose: confirm a failed fetch shows a retry option.
- Steps: simulate a backend outage (stop the backend) and reload `/products`.
- Expected Result: `ErrorState` renders with a working "Try again" button.
- Pass/Fail: [ ]

---

## Creator

**Dashboard**
- Purpose: confirm the creator dashboard loads.
- Steps: log in as a seeded creator, visit `/dashboard`.
- Expected Result: renders without error (subject to the auth-bridge gap below).
- Pass/Fail: [ ]

**Product CRUD**
- Purpose: confirm the full create → edit → delete cycle works in the UI.
- Steps: `/dashboard/products/new`, fill the form, submit; edit the result; delete it.
- Expected Result: each step succeeds and redirects/updates appropriately.
- Pass/Fail: [ ]

**Inventory**
- Purpose: confirm the Add/Remove stock controls on the Edit page work.
- Steps: on a product's edit page, use the inventory panel's Add/Remove buttons.
- Expected Result: displayed stock updates to match.
- Pass/Fail: [ ]

**Upload**
- Purpose: confirm both the file picker and drag-and-drop upload paths work.
- Steps: use "Choose a file", then drag an image onto the drop zone.
- Expected Result: both add a photo to the gallery; invalid file types/sizes are rejected client-side with a clear message.
- Pass/Fail: [ ]

**Reorder Images**
- Purpose: confirm both drag reordering and the keyboard fallback work.
- Steps: drag one photo to a new position; then use the Move-earlier/Move-later buttons via keyboard only.
- Expected Result: both methods reorder the gallery and persist (refresh confirms the new order).
- Pass/Fail: [ ]

**Duplicate Product**
- Purpose: confirm Duplicate creates a new DRAFT with the same details.
- Steps: click Duplicate on a product in the list.
- Expected Result: a new product appears titled "{original} (Copy)", same variants (price/attributes) but SKUs cleared and stock at 0, no photos.
- Pass/Fail: [ ]

**Bulk Actions**
- Purpose: confirm multi-select archive/delete work, including partial-failure reporting.
- Steps: select 2+ products, use "Archive selected", confirm.
- Expected Result: a success/warning banner reports how many succeeded (and if any failed, how many).
- Pass/Fail: [ ]

**Preview**
- Purpose: confirm the live preview card reflects the current form state.
- Steps: on the Edit page, change the title.
- Expected Result: the preview card's title updates immediately, before any save completes.
- Pass/Fail: [ ]

**Autosave**
- Purpose: confirm changes persist automatically without clicking Save.
- Steps: edit the description, wait ~2 seconds without further typing, then reload the page.
- Expected Result: the status indicator shows "Saving…" then "All changes saved"; after reload, the new description is still there.
- Pass/Fail: [ ]

**Unsaved Changes**
- Purpose: confirm the browser warns before an accidental close during the autosave-pending window.
- Steps: start typing, then immediately try to close the tab (within ~1.5s, before autosave fires).
- Expected Result: the browser's native "leave site?" prompt appears.
- Pass/Fail: [ ]

---

## Regression

**Authentication**
- Purpose: confirm none of this sprint's changes broke existing auth flows.
- Steps: register, log in, log out, forgot/reset password as a fresh buyer.
- Expected Result: all work exactly as before this sprint.
- Pass/Fail: [ ]

**Navigation**
- Purpose: confirm shared navigation (header, sidebar) still works in both apps.
- Steps: click through primary nav links in buyer and creator apps.
- Expected Result: no broken links, no console errors.
- Pass/Fail: [ ]

**Shared Components**
- Purpose: confirm components used both before and after this sprint's migration still render correctly everywhere.
- Steps: spot-check `Button`, `Card`, `Checkbox`, `Badge`, `Alert` in a screen this sprint didn't touch (e.g. the signup form) and one it did (e.g. `/dashboard/products`).
- Expected Result: consistent appearance and behavior in both.
- Pass/Fail: [ ]

**API**
- Purpose: confirm pre-existing endpoints not touched by Sprint 01 still respond correctly.
- Steps: `GET /api/v1/health`, `POST /api/v1/auth/register` (malformed), unauthenticated creator/store routes. **[verified live this session]**
- Expected Result: `200`, `422`, `401` respectively — all before any DB call.
- Pass/Fail: [x] (verified this session)

**Database**
- Purpose: confirm migrations apply cleanly to a fresh database and match the live schema.
- Steps: on a fresh Postgres instance, run the migration command (see `DEVELOPMENT_STATUS.md`), then inspect `products` for a `deleted_at` column. **[verified live this session]**
- Expected Result: both migrations (`0000_init`, `0001_sprint01_products_soft_delete`) apply; `deleted_at` and its index exist.
- Pass/Fail: [x] (verified this session — this test caught and led to fixing a real, previously-undetected bug: migration 0001 had never actually been applying due to a corrupted migration journal file. See the "fix(database): CRITICAL" commit.)

**Responsive**
- Purpose: confirm both apps remain usable across breakpoints after this sprint's UI changes.
- Steps: resize both apps through mobile/tablet/desktop.
- Expected Result: no layout breakage introduced by this sprint's components.
- Pass/Fail: [ ]

**Performance**
- Purpose: confirm this sprint didn't introduce an obvious regression (e.g. an N+1 query, an unbounded list render).
- Steps: see Phase 12's Performance Review in `DEVELOPMENT_STATUS.md` for what was checked and what's still a recommendation, not a fix.
- Expected Result: no new N+1 patterns in the Products module's repository layer (reviewed: all list/detail queries use `Promise.all` for parallel independent fetches, not per-row loops).
- Pass/Fail: [ ]
