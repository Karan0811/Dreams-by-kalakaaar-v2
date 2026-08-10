# TESTING.md — Sprint 02: Marketplace Foundation

This document covers setup, verification commands, and test cases for every module built in Sprint 02. It reflects what was actually run and verified during this sprint (backend live-tested end-to-end against a real Postgres instance; frontend live-tested end-to-end through the real BFF layer with real bridged sessions), not aspirational coverage.

## 1. Project Setup

### Backend
```bash
cd backend
pnpm install
cp .env.example .env.local
# edit .env.local — see "Environment Configuration" below
pnpm db:migrate
pnpm db:seed
pnpm dev        # http://localhost:3000
```

### Frontend (both apps)
```bash
cd frontend
npm install
cp apps/buyer/.env.example apps/buyer/.env.local
cp apps/creator/.env.example apps/creator/.env.local
# edit both .env.local — see "Environment Configuration" below

# Better Auth's own schema (separate from the backend's schema) must be applied once:
psql "$DATABASE_URL" -f packages/auth/migrations/0001_better_auth_schema.sql

npm run dev --workspace=apps/buyer     # http://localhost:3002 (or configured port)
npm run dev --workspace=apps/creator   # http://localhost:3001 (or configured port)
```

## 2. Environment Configuration

### Backend `.env.local`
Required: `DATABASE_URL`, `BETTER_AUTH_SECRET` (validated but not directly used by the backend), `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` (PEM — see `jwt-private.pem`/`jwt-public.pem` in the repo for local dev keys), `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (a live Upstash instance, or any URL — the rate-limiter degrades gracefully if unreachable, per Sprint 01's design).

**Do not set `NODE_ENV` in `.env.local` / `.env`.** This was a real, reproducible bug found and fixed this sprint: Next.js manages `NODE_ENV` itself (`development` for `next dev`, `production` for `next build`/`next start`), and an explicit override breaks `next build`'s own static generation of `/404` and `/_error` with `<Html> should not be imported outside of pages/_document`. `.env.example` has been corrected; if working from an older checkout, remove any `NODE_ENV=` line from local env files.

### Frontend `.env.local` (both apps)
Required: `DATABASE_URL` (same Postgres instance as the backend — Better Auth's tables live alongside the backend's own schema), `BETTER_AUTH_SECRET`, `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL`.

**`API_BASE_URL` must include the `/v1` segment**, e.g. `http://localhost:3000/api/v1` for local dev against the backend running per Section 1, or `https://api.dreamsbykalakaaar.com/v1` in a deployment where the backend is a separate service at its own domain root. Every endpoint function in `@dbk/api-client` writes paths without a `/v1` prefix (e.g. `/users/me/cart`), so the base URL is the only place `/v1` belongs. Getting this wrong produces a working `tsc`/`eslint` build that 404s or 502s at runtime — a real bug found only through live testing this sprint, not through static checks.

## 3. Backend Testing

```bash
cd backend
pnpm typecheck   # tsc --noEmit — expect 0 errors
pnpm lint        # expect 0 errors
pnpm boundaries:check   # architectural import-boundary rule — expect 0 errors
pnpm test        # vitest — expect 98/98 passing across 10 test files
pnpm build       # next build — expect success, all 62 routes compiled
```

Expected `pnpm test` output: 10 files (creators, products, categories, addresses, wishlist, cart, orders, reviews, notifications schema tests, plus shared/validation), 98 tests, 0 failures.

## 4. Frontend Testing

```bash
cd frontend
npm run type-check --workspace=apps/buyer     # expect 0 errors
npm run type-check --workspace=apps/creator   # expect 0 errors
npm run lint --workspace=apps/buyer           # expect 0 errors
npm run lint --workspace=apps/creator         # expect 0 errors
```

**Known, pre-existing, environment-only build limitation:** `next build` for both apps fails in network-restricted sandboxes because `next/font/google` fetches `fonts.googleapis.com` at build time, which such sandboxes block. This predates Sprint 02 (see `DEVELOPMENT_STATUS.md`'s own "Known Issues" section from the prior sprint) and is not a code defect — confirmed this sprint by running `next dev` instead, which serves every route with `200 OK` and gracefully falls back to a system font when the Google Fonts fetch fails, proving the rest of the app (routing, data fetching, rendering) is unaffected. In an environment with network access, `next build` completes normally.

**Known, pre-existing, out-of-scope gap:** the buyer app's product catalog list page (`/products`) and its underlying `fetchProductList` function target an aspirational Sprint 01 backend contract that the real Products backend never implemented. Confirmed via `git diff` that these files are untouched by Sprint 02. Sprint 02's own additions to the product detail page (the Reviews section, Add to Cart's real variant wiring) are correct and were verified via direct BFF calls; the parent page's own data-fetch is a Sprint 01 gap outside Marketplace Foundation's scope.

## 5. API Testing (manual, via curl)

```bash
# 1. Register + login (backend directly)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@example.com","password":"StrongPassw0rd!123","displayName":"Test Buyer"}'

curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@example.com","password":"StrongPassw0rd!123"}'
# → { accessToken, accessTokenExpiresIn }

# 2. Use accessToken as a Bearer token on every subsequent call
TOKEN="<accessToken from above>"

curl -X POST http://localhost:3000/api/v1/users/me/addresses \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"recipientName":"Test Buyer","recipientPhone":"9999999999","line1":"1 MG Road","city":"Bengaluru","state":"Karnataka","postalCode":"560001","isDefault":true}'
```

This exact sequence — through the real frontend BFF, not just the backend directly — was run live this sprint for: signup → email-verify → login → session-bridge → add-address → add-to-cart → checkout → order-created → cart-cleared → wishlist-add → notifications-list, and separately for the creator side: signup → apply-as-creator → bridge → add-creator-address → add-bank-detail (verified last-4-digit masking, no raw account number in the response) → add-social-link → create-product → add-variant.

## 6. Database Verification

```sql
-- Confirm Sprint 02 tables exist
\dt

-- Should include (new this sprint):
-- creator_addresses, creator_bank_details, creator_social_links, creator_documents,
-- user_addresses, wishlist_items, cart_items, orders, order_items,
-- order_status_history, reviews, notifications

-- Confirm bank details are encrypted at rest (never plaintext)
SELECT account_holder_name, account_number_encrypted, account_number_last4,
       ifsc_code_encrypted, is_verified
FROM creator_bank_details;
-- account_number_encrypted / ifsc_code_encrypted must be ciphertext (format: iv:tag:ciphertext),
-- never a readable account number or IFSC code.

-- Confirm categories self-reference + soft delete
\d categories
-- parent_id must have a FK to categories.id; deleted_at column must exist.
```

Zero schema drift was confirmed via `drizzle-kit generate` returning "No schema changes" after all Sprint 02 model changes were made — every schema change in code has a corresponding, applied migration.

## 7. Authentication Testing

| Case | Expected |
|---|---|
| Register with a new email | 201, returns `accessToken` |
| Register with an existing email | 409 `CONFLICT` |
| Login with correct credentials | 200, returns `accessToken` + `accessTokenExpiresIn` (900s) |
| Login with wrong password | 401, generic "incorrect" message (no user enumeration) |
| Call any `/v1/users/me/*` route with no `Authorization` header | 401 |
| Call any `/v1/users/me/*` route with an expired/garbage token | 401 |
| Frontend: sign up via Better Auth, then call a BFF route before the bridge fires | 401 or 501 (`AUTH_BRIDGE_NOT_CONFIGURED`), never a raw crash |
| Frontend: sign up → bridge-register → immediately call a BFF route | 200/201, real backend data returned |
| Frontend: sign out | Both Better Auth's session cookie and the `dbk_access_token`/`dbk_refresh_token` bridge cookies are cleared |

## 8. RBAC Testing

| Actor | Action | Expected |
|---|---|---|
| Anonymous | `GET /v1/categories` | 200 (public read) |
| Anonymous | `POST /v1/categories` | 401 |
| Authenticated buyer (no `categories:write`) | `POST /v1/categories` | 403, `Missing required permission: categories:write` |
| Admin (has `categories:write`) | `POST /v1/categories` | 201 |
| Creator A | `GET` Creator B's store's product variants | 403 (`requireStoreProductOwnership` fails) |
| Creator A | CRUD on Creator A's own store's products/variants | 200/201 |
| Buyer | `PATCH /v1/admin/orders/:id/status` (no `orders:manage`) | 403 |
| Admin (has `orders:manage`) | `PATCH /v1/admin/orders/:id/status` with a valid transition | 200 |
| Admin (has `orders:manage`) | same, with an invalid transition (e.g. `CONFIRMED` → `DELIVERED`) | 422 |
| Any authenticated user | `POST /v1/creator/addresses` without an approved (or even pending) Creator application | 404 `CreatorApplicationNotFoundError` |
| Admin (has `creators:review`) | `PATCH /v1/admin/creators/:id/status` | 200, and a `CREATOR_APPLICATION_STATUS` notification is created for that creator |

Default role assignment: every newly registered account gets the `Buyer` role automatically (confirmed via `user_roles` inspection) — there is no separate "buyer" RBAC permission set beyond this; regular users are buyers by default, per the sprint's instruction.

## 9. CRUD Test Cases Per Module

For every module below: Create → List → Get/Detail → Update → Delete (or Archive/Cancel where hard delete doesn't apply) was exercised live this sprint, either via direct backend curl calls, via the frontend BFF layer, or both.

### Creator (Address / Bank Details / Social Links / Documents / Status)
- Create an address, list addresses, update it, set `isDefault` (confirms the other addresses' `isDefault` flips to `false`), delete it.
- Create a bank detail with a valid IFSC (`HDFC0001234` format) — confirm the response never contains the raw account number, only `accountNumberLast4`. Confirm the DB row is encrypted (Section 6).
- Create a social link per platform; re-posting the same platform **updates** the existing link rather than erroring (upsert-by-platform, confirmed in `service.ts`).
- Request a document upload URL, PUT the file to the returned presigned URL, confirm the document via `mediaId`, list documents, delete a `PENDING_REVIEW` document (a reviewed one cannot be deleted by the creator).
- Admin transitions: `PENDING_REVIEW → APPROVED`, `APPROVED → ACTIVE`, `ACTIVE → SUSPENDED`, `SUSPENDED → ACTIVE`, `ACTIVE/SUSPENDED → CLOSED`. Any transition not in this table returns 422 `InvalidCreatorStatusTransitionError`.

### Categories / Subcategories
- Create a top-level category (auto-slug from name if omitted).
- Create a subcategory under it (`parentId` set).
- Attempt to create a sub-subcategory (parent's `parentId` is non-null) → 422, one level of nesting only.
- Attempt to delete a category with subcategories → 409.
- Attempt to delete a category with products assigned → 409.
- Duplicate slug → 409.
- `PUT /parent` moves a category between top-level and subcategory.

### Products / Product Images / Product Variants / Inventory
- (Images and base Inventory adjust were built in Sprint 01 and reused unmodified this sprint — reverified working, not rebuilt.)
- Standalone variant CRUD: add a 2nd variant to an existing product, update its price/SKU, list all variants with live inventory joined in, archive one.
- **Archiving a product's only remaining `ACTIVE` variant is blocked with 422** — verified live.
- Inventory `GET` (new this sprint) returns `quantityAvailable`/`quantityReserved`/`lowStockThreshold` per variant.

### User Addresses / Wishlist / Cart
- Address CRUD identical shape to Creator Addresses, scoped to the buyer.
- Wishlist: add (`products.wishlistCount` increments), duplicate add → 409, remove (`wishlistCount` decrements), list joins in product title/slug/status.
- Cart: add (merges quantity if the variant is already in the cart rather than duplicating the row), update quantity (blocked with 422 if it exceeds live `quantityAvailable`), remove, get-cart (returns live stock alongside each line so the UI never shows stale availability).

### Orders
- Create from cart: reads the cart inside one transaction, re-validates every line's stock, creates the order + line items, decrements inventory, clears the cart — all atomically. **Verified live: inventory 5 → 3 on a 2-unit order.**
- List mine, get detail (includes line items + full status history).
- Cancel: only from `PENDING`/`CONFIRMED`; **verified live: cancelling restocks inventory exactly (3 → 5)**; a second cancel attempt on an already-cancelled order → 422.
- Admin status transition: linear `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`, `CANCELLED` reachable from any non-terminal state; **verified live: a valid transition succeeds, an invalid skip (`CONFIRMED → DELIVERED`) is rejected with 422.**
- Every status change (buyer cancel or admin transition) creates a `Notification` for the buyer — verified live.

### Reviews
- Create a review for a product: `isVerifiedPurchase` correctly reflects whether the reviewer has a `DELIVERED` order item for that product (verified `false` for a non-purchaser).
- Duplicate review by the same user on the same product → 409.
- Update/delete own review — both trigger a full recalculation of `products.averageRating`/`reviewCount` (verified: 5★/1 review → 0/0 after the review was removed).
- Admin moderation delete (`reviews:moderate`) works on any review regardless of ownership, and also triggers the recalculation.
- Creating a review sends a `PRODUCT_REVIEW_RECEIVED` notification to the product's store owner — **verified live**, including that marking it read correctly zeroes the unread count.

### Notifications
- List (with `unreadOnly` filter and pagination), mark one read, mark all read, delete.
- Confirmed notifications are created as real side effects of Orders (status change, cancel), Creators (document review, status transition), and Reviews (new review) — not a standalone, disconnected feature.

## 10. Integration Testing

The following cross-module flows were run live, end-to-end, through the real frontend BFF layer (not just the backend directly) against a real Postgres database this sprint:

1. **Buyer purchase flow**: sign up → verify email → log in → session bridges to backend → add shipping address → add item to cart → checkout (address selection, no payment step by design) → order created in `PENDING` → cart cleared → order visible in order history → cancel → inventory restocked.
2. **Creator onboarding flow**: sign up → apply as creator → session bridges → add registered address → add bank details (masked in response) → add social link → create a product → add a second variant to it.
3. **Cross-tenant isolation**: Creator A's bridged session attempting to read/write Creator B's product variants is rejected with 403 at the ownership-check layer, not just hidden by the UI.
4. **Notification fan-out**: a buyer's review of a product produces a notification for that product's store owner, readable through that owner's own notifications endpoint.

## 11. Security Testing

- **Encryption at rest**: Creator bank account numbers and IFSC codes are AES-encrypted before storage (verified via direct SQL inspection — Section 6); only the last 4 digits of the account number are ever returned by the API.
- **Authorization boundaries**: every mutating endpoint requires authentication; every creator-scoped endpoint additionally requires either resource ownership or a specific RBAC permission — verified negative cases (wrong owner, missing permission) return 403, not silently succeed or leak data.
- **SQL injection**: all queries go through Drizzle's parameterized query builder; no raw string concatenation into SQL anywhere in Sprint 02's code (same standard the rest of the codebase already holds itself to).
- **Idempotency**: state-changing frontend mutations (add to cart, create order, create review, etc.) pass an `idempotencyKey` through `apiFetch`, consistent with the existing Sprint 01 convention.
- **Auth bridge cookie hygiene**: `dbk_access_token`/`dbk_refresh_token` are httpOnly, `sameSite: lax`, and `secure` in production; cleared on sign-out.

## 12. Performance Checklist

- [x] Inventory decrement/restock uses a single atomic `UPDATE ... SET quantity = quantity ± delta` (never read-then-write), avoiding lost updates under concurrent orders.
- [x] Order creation is a single database transaction — no partial state possible on failure.
- [x] List endpoints (orders, notifications, reviews) support `limit`/`offset` pagination; none return unbounded result sets.
- [x] Rating recalculation on review create/update/delete is a single aggregate query (`COUNT`/`AVG`), not an application-level loop over all reviews.
- [ ] Not yet load-tested under concurrent write load — recommended before production traffic, same caveat Sprint 01 already carried forward.

## 13. Manual QA Checklist

- [x] Buyer can add an address, add to cart, and complete checkout without a payment step (explicitly out of scope this sprint) — end state is a `PENDING` order.
- [x] Buyer sees loading skeletons while data fetches, an empty state with a clear call-to-action when a list is genuinely empty, and a retry-capable error state on fetch failure — verified across Addresses, Wishlist, Orders, Notifications, Cart.
- [x] Creator can manage their full profile (address/bank/social/documents) from one Settings page with tabs.
- [x] Creator can add/edit/archive product variants from the existing product edit page, alongside the pre-existing inventory panel.
- [x] Deleting anything destructive (address, category, review, bank detail) goes through a confirm dialog first.
- [x] Toast messages are generic and friendly on error (never raw server messages), specific and reassuring on success.

## 14. Regression Checklist

- [x] Sprint 01's Products module (create, publish-gate, media attach, base inventory adjust) still passes its own existing tests unmodified.
- [x] Sprint 01's Cart feature was **found broken** (targeted a `/cart` + `X-User-Id` contract the real backend never implemented) and has been **fixed** to the real `/v1/users/me/cart` contract this sprint — this is a fix, not new breakage.
- [x] `pnpm-workspace.yaml`'s stray auto-generated diff (from a dependency install, unrelated to Sprint 02) was reverted so the changeset stays scoped.
- [x] No existing route, schema, or component was rewritten beyond what was necessary to connect it to real Sprint 02 data (Cart) or fix a genuine bug (auth bridge, build config).

## 15. Build Verification

```bash
# Backend
cd backend
pnpm lint && pnpm typecheck && pnpm test && pnpm build
# Expected: 0 lint errors, 0 typecheck errors, 98/98 tests passing, build succeeds (62 routes)

# Frontend
cd frontend
npm run lint --workspace=apps/buyer && npm run type-check --workspace=apps/buyer
npm run lint --workspace=apps/creator && npm run type-check --workspace=apps/creator
# Expected: 0 errors in both apps.
# `next build` for both apps requires network access to fonts.googleapis.com (Section 4) —
# in a network-restricted environment, verify via `next dev` instead, which was done this sprint.
```

## 16. Documented Assumptions (Sprint 02)

1. **Order status is order-level, not per-store.** A multi-vendor order splits into `order_items` carrying each item's `storeId` (so a creator's dashboard could filter to their own items), but there is one status for the whole order, not one per store-within-an-order. True split-fulfillment is a natural follow-up once payments exist.
2. **Order status transitions are admin-only** and strictly linear: `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`, with `CANCELLED` reachable from any non-terminal state. Buyers can only self-cancel from `PENDING`/`CONFIRMED`.
3. **Creator onboarding status transitions**: `PENDING_REVIEW → {APPROVED, REJECTED}`, `APPROVED → {ACTIVE, SUSPENDED}`, `ACTIVE ↔ SUSPENDED`, either `→ CLOSED`. `REJECTED`/`CLOSED` are terminal.
4. **Subcategories reuse the `categories` table** via self-referencing `parentId` (one level of nesting only) rather than a parallel table — this matched an unused column already present in Sprint 01's schema.
5. **A review is gated to one per user per product**, optionally linked to a `DELIVERED` order item for a "Verified Purchase" badge — not required to purchase before reviewing, since the brief didn't specify purchase-gating.
6. **`products.averageRating` is an integer** (pre-existing Sprint 01 column), so the computed average is rounded to the nearest whole star rather than storing a fractional value.
7. **Categories admin UI lives in the Creator app** (`/dashboard/categories`) since no separate admin app exists in this project; the backend's own `categories:write` RBAC check is the real enforcement boundary, and a non-admin creator visiting this page will see reads succeed and writes correctly rejected with 403.
8. **The auth bridge re-authenticates against the backend with the same credentials** immediately after a successful Better Auth sign-in/sign-up, storing the backend's own short-lived JWT + refresh token in separate httpOnly cookies scoped to each frontend app's own domain. This was necessary because the frontend's Better Auth and the backend's own JWT auth were, before this sprint, two fully independent systems with no bridge at all — a real gap, not a hypothetical one, confirmed by every authenticated BFF route being unreachable prior to this fix.
