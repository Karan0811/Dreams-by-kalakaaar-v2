# Sprint 2 — Final Test Report

**Scope:** Full-stack code audit and fixes for Sprint 2 (Marketplace Foundation) across Addresses, Wishlist, Orders, Reviews, Notifications, Categories/Subcategories, Products/Images/Variants/Inventory, plus the in-progress Auth Bridge / Creator / Cart work already underway when this session started.

**Method:** Every finding below was reached by reading the actual source on disk — routes, services, repositories, schemas, migrations, hooks, and components — and cross-referencing them against each other (e.g. does the frontend hook call the route that exists; does the migration SQL match the Drizzle schema; does an authorization check actually bind every ID it claims to). No finding in this report is based on assumption, prior documentation, or the repo's own earlier "verified"/"tested" claims, per this sprint's explicit instruction not to trust those.

**Environment constraint (read this first):** this sandbox has no network egress and started with no installed dependencies. `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `db:migrate`, `db:seed`, and any live Supabase/Postgres connectivity check **could not be executed**. Every item under "Tests Actually Executed" below is either a real static-inspection check I performed, or explicitly marked **NOT EXECUTED**. Nothing here claims a live pass that didn't happen.

---

## 1. Issues Found & Fixed

### Critical

**1.1 — IDOR: creator product-ownership check never verified the product belongs to the store**
`backend/src/modules/products/authorization.ts`'s `requireStoreProductOwnership(userId, storeId, permission)` verified the caller owns `storeId`, but never checked that `productId` — also just a client-supplied URL parameter — actually belongs to that store. Any authenticated creator who owns *any* store could read, update, publish/pause/archive, or delete **any other creator's product** (plus its media, variants, and inventory) by pairing their own `storeId` with an arbitrary `productId`. Affected 13 call sites across 7 route files:
- `stores/[storeId]/products/[productId]/route.ts` (GET/PATCH/DELETE)
- `.../media/route.ts`, `.../media/upload-url/route.ts`, `.../media/[productMediaId]/route.ts`
- `.../variants/route.ts`, `.../variants/[variantId]/route.ts`, `.../variants/[variantId]/inventory/route.ts`

This predates Sprint 2 — it's a Sprint 1 bug that Sprint 2's new Variant/Inventory routes also inherited by reusing the same helper.

**Fix:** `requireStoreProductOwnership` now takes `productId` and verifies `product.storeId === storeId` (via a new `getProductStoreId` service function) before proceeding, throwing `ProductNotFoundError` (404) on mismatch — so a probing creator can't distinguish "wrong store" from "doesn't exist." All 13 call sites updated.

### High

**1.2 — Password policy mismatch silently stranded Better-Auth-only accounts**
Backend `passwordSchema` required 12+ characters; Better Auth's `minPasswordLength` was 10; the frontend's own `passwordSchema` (which claimed in its own comment to mirror the backend) was also 10. A 10–11 character password passed Better Auth sign-up but was rejected by the backend's `/v1/auth/register` bridge call — which `SignupForm.tsx` never checked, so the user was redirected to `/verify-email` regardless, left with a real Better Auth account and no backend account. Every backend-dependent feature would then fail permanently with no visible cause.

**Fix:** aligned all three to 12; `SignupForm.tsx` now checks the bridge response and stops with a clear error instead of proceeding as if it succeeded.

**1.3 — Untyped 500 for an ordinary, foreseeable checkout failure**
`checkoutFromCart` threw a plain `Error('Shipping address not found.')` for an invalid/foreign `shippingAddressId` — the global error handler can only map an untyped `Error` to a generic 500, masking what should be a 404.

**Fix:** added `ShippingAddressNotFoundError extends NotFoundError` and threw it instead.

### Medium

**1.4 — Wishlist listing didn't exclude soft-deleted products**
`listWishlistItems` joined `products` without the `isNull(products.deletedAt)` filter every other product read in the codebase applies — a deleted product stayed in a buyer's wishlist forever instead of disappearing.

**Fix:** added the filter, matching the established `notDeleted` convention in `products/repository.ts`.

**1.5 — Inventory-adjustment error alert could never fire**
`ProductInventoryPanel.tsx`'s parent component displayed an error `Alert` wired to its own `useAdjustInventory()` hook instance — but the actual mutation happens in each child `VariantRow`'s own, separate hook instance. TanStack Query mutation state isn't shared across call sites, so the parent's error state could never become true regardless of what a user did.

**Fix:** moved the error display into `VariantRow` itself (also more correct UX — it now points at the specific variant that failed, not a generic list-level message).

### Low / cleanup

- **1.6** — Removed an orphaned, unused `addressSchema`/`AddressInput` export in `shared-schemas.ts` (Sprint 1 leftover; `AddressesClient.tsx` has its own correct, currently-used local schema).
- **1.7** — Moved a mid-file `import` statement in `products/repository.ts` to the top of the file (violated `import/first`-style convention; was legal JS but messy).
- **1.8** — Removed a stray junk directory literally named `backend/src/modules/{addresses,wishlist,cart,orders,reviews,notifications,categories}` — the artifact of a failed shell brace-expansion (`mkdir` run under `sh`, not `bash`) from an earlier session.
- **1.9** — Removed repo-root junk: `.DS_Store` (all instances, recursively), `docs.zip` (confirmed a stale, strictly-older subset of the already-unzipped `docs/` directory — missing 3 files that exist there now), `task1-changes.diff` (confirmed fully applied — its end-state hash matched the current committed baseline), and an empty 101-byte root `package-lock.json` stub (`{"packages": {}}`) that was almost certainly the actual cause of the previously-documented "multiple lockfiles" build warning.
- **1.10** — Added explicit `outputFileTracingRoot` to both `next.config.ts` files, pointing at `frontend/` (the real workspace root), rather than relying on Next's upward lockfile inference.

### Investigated and confirmed NOT bugs (documented so they aren't "found" again)

- Every other module's `throw new Error('Failed to create X row.')` pattern (addresses, wishlist, orders, reviews, notifications, categories, creators) — these guard an impossible state (an `INSERT ... RETURNING` that returned nothing without throwing), not a foreseeable user error. A 500 is the correct response for a genuine invariant violation; only 1.3 above (a real, expected 404 case) was actually wrong.
- Hardcoded `"INR"` currency literals in `CartView.tsx`, `CheckoutClient.tsx`, `DashboardOrdersPreview.tsx`, `OrdersListClient.tsx`, and the `as "INR"` cast in `OrderDetailClient.tsx` — I initially "fixed" these to read the real `currency`/`priceCurrency` string fields instead, then caught my own mistake: `Money.currency` is a deliberately narrow `"INR"` literal type (single-currency system by design), so the literals and the cast are the correct, type-safe pattern. **Reverted** before this was delivered.

---

## 2. Modules Completed (this session's audit pass)

| # | Module | Result |
|---|---|---|
| — | Auth Bridge (JWT/BFF) | Verified — 1 fix (1.2) |
| — | Creators (profile/address/bank/social/documents) | Verified clean |
| — | Cart / Inventory (checkout-adjacent) | Verified clean |
| 1 | Addresses | Verified — 1 fix (1.6) |
| 2 | Wishlist | Verified — 1 fix (1.4) |
| 3 | Orders | Verified — 1 fix (1.3) |
| 4 | Reviews | Verified clean |
| 5 | Notifications | Verified clean |
| 6 | Categories/Subcategories | Verified clean |
| 7 | Products/Images/Variants/Inventory | Verified — 3 fixes (1.1, 1.5, 1.7) |
| 8 | Cross-module integration | Verified clean (order↔inventory restock, review↔notification, creator-approval↔store-creation, RBAC seed↔route permission-key matching) |

## 3. Database / Migration Changes
- No new migration required. All 12 Sprint 2 tables (`creator_addresses`, `creator_bank_details`, `creator_documents`, `creator_social_links`, `user_addresses`, `wishlist_items`, `cart_items`, `order_items`, `order_status_history`, `orders`, `reviews`, `notifications`) are already covered by `database/migrations/0002_equal_franklin_storm.sql`, confirmed column-for-column against the current Drizzle schema.
- Confirmed `database/migrations/meta/_journal.json` correctly registers migration `0002` (this registration was itself the fix for a recurrence of the Sprint 1 "unapplied migration" bug class, already done correctly in the WIP I inherited — I verified it, didn't need to redo it).
- Verified `product_variants`/`inventory` tables predate Sprint 2 (from `0000_init.sql`), so the new standalone Variant CRUD and Inventory-read work needed no schema change.

## 4. API Changes
- **Security-relevant:** `requireStoreProductOwnership` signature changed from `(userId, storeId, permission)` to `(userId, storeId, productId, permission)` — a breaking internal change, but it only tightens behavior (previously-succeeding cross-store requests now correctly 404).
- Added `ShippingAddressNotFoundError` (orders), `getProductStoreId` (products service).
- No public request/response contract changes — every fix above was either an authorization tightening, an error-type correction, or a query-filter correction; no field was added/removed/renamed on any response body.

## 5. Frontend Changes
- `SignupForm.tsx` — now handles bridge-registration failure.
- `CartView.tsx`, `ProductInventoryPanel.tsx` — see 1.5.
- `shared-schemas.ts`, `products/repository.ts` — dead code / import hygiene.
- `next.config.ts` (both apps) — `outputFileTracingRoot`.

## 6. Tests Actually Executed

**Static/manual verification actually performed** (by reading source, not by running anything):
- Cross-referenced every new backend route against its service/repository functions to confirm no broken imports or missing functions (all confirmed present).
- Cross-referenced every new `@dbk/api-client` endpoint/hook export against `server.ts`/`index.ts`'s re-exports (all matched).
- Cross-referenced every backend Zod schema against the frontend form/type that populates it (SKU/price/attributes fields, address fields, cart/order payloads).
- Traced RBAC: confirmed every `authorize(userId, 'x:y')` permission key used in a route actually exists in `seed.ts` and is granted to the intended role.
- Traced ownership scoping: confirmed addresses/wishlist/notifications repositories filter every query by `userId`; confirmed the Sprint 1 product-ownership IDOR (1.1) and fixed it.
- Validated `database/migrations/meta/_journal.json` as well-formed JSON with `python3 -m json.tool` equivalent check, and diffed migration SQL against schema files table-by-table.
- Diffed `docs.zip`'s file list against the live `docs/` directory to confirm it was safe to delete.

**NOT EXECUTED (environment constraint — no network, no installed dependencies, no live database in this sandbox):**
- `npm install` (root has no lockfile of its own; `frontend/` uses npm workspaces, `backend/` uses pnpm — see note below)
- `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` (frontend and backend)
- `db:migrate` / `db:seed` / `db:seed:demo` against a real Postgres/Supabase instance
- Any live HTTP request through the actual running app (signup→login→JWT→protected route, buyer flow, creator flow, admin flow, authorization-boundary probing)
- Supabase connectivity check

**Correction to prior documentation:** the actual package manager is **npm**, not pnpm as stated in earlier project memory/docs — `frontend/package.json` declares `"packageManager": "npm@10.5.0"` with npm workspaces (`frontend/package-lock.json`, real and populated), while `backend/` separately uses pnpm (`backend/pnpm-lock.yaml`). This is a hybrid setup, not a single pnpm monorepo. Worth confirming this is intentional.

## 7. Pass/Fail Summary

| Category | Status |
|---|---|
| Static code audit (all 7 priority modules + auth/creator/cart WIP + cross-module) | **PASS** — completed, issues found and fixed |
| Root-cause fixes applied | **PASS** — 5 real bugs fixed, 4 cleanup items, all with inline rationale comments in the code |
| Junk/dead code removed | **PASS** |
| `npm install` / dependency resolution | **NOT EXECUTED** |
| Lint | **NOT EXECUTED** |
| Typecheck | **NOT EXECUTED** |
| Unit/integration tests | **NOT EXECUTED** |
| Production build | **NOT EXECUTED** |
| Migrations against live DB | **NOT EXECUTED** |
| Supabase connectivity | **NOT EXECUTED** |
| End-to-end flows (buyer/creator/admin) | **NOT EXECUTED** |
| Authorization-boundary live probing | **NOT EXECUTED** (the one concrete boundary violation found — 1.1 — was found and fixed by code inspection, not live probing) |

## 8. Remaining Known Issues / Follow-ups
- **You must run the install/lint/typecheck/test/build/migrate commands yourself** (or in CI) before treating anything in this report as "verified" in the sense your original brief means. Every fix here is grounded in real source-code cross-referencing, but none of it has been compiled or executed.
- The `outputFileTracingRoot` fix (1.10) is a best-practice hardening on top of removing the actual root cause (the stray lockfile); it hasn't been build-tested.
- `frontend/apps/creator`'s document-review, bank-details, and social-links flows were verified in the earlier auth/creator WIP pass but not re-walked end-to-end in this module-by-module pass — worth a targeted look if time permits.
- No payment gateway integration exists (correct — explicitly out of scope for this sprint).
- `apps/internal` (dedicated admin/moderator app) still doesn't exist; admin actions (category management, order status, review moderation, creator approval) are served through the creator app's routes/UI gated by RBAC permission, not a separate app — consistent with memory's note that `apps/internal` is scoped to a future sprint, but worth confirming this is still the intended shape for Sprint 2's "Admin" flows.
