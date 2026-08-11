# Dreams by Kalakaaar v2 — Sprint 2: Marketplace Foundation — TESTING

**Read this before trusting anything below.** This document was rewritten from scratch during a Sprint 2 code audit. Every row's "Actual Result" is either something genuinely checked by reading source code, or is honestly marked **NOT EXECUTED**, because the environment that produced this document had no network access, no installed dependencies, and no live database connection. A PASS below means "verified by inspecting the actual source"; it does not mean "ran and observed the behavior." Do not copy PASS marks forward without re-running the steps yourself — see `FINAL_TEST_REPORT.md` for the full list of what was and wasn't executed, and for the specific bugs found and fixed this pass.

---

## 1. Prerequisites

- Node.js 20.x (see `frontend/package.json` engines / CI config)
- **Package managers — this is a hybrid monorepo, not a single one:**
  - `frontend/` — **npm** workspaces (`"packageManager": "npm@10.5.0"`, real lockfile at `frontend/package-lock.json`)
  - `backend/` — **pnpm** (`backend/pnpm-lock.yaml`)
  - There is no root-level package manager; run installs separately in each directory.
- PostgreSQL 15+ (Supabase-hosted or local)
- A Supabase project (or local Postgres) with credentials for `backend/.env` (see `backend/.env.example`)

## 2. Environment Setup

```bash
cd backend && cp .env.example .env   # fill in real values — see Section 3
cd ../frontend && cp apps/buyer/.env.example apps/buyer/.env.local
cp apps/creator/.env.example apps/creator/.env.local
```
Required backend env vars (non-exhaustive — check `.env.example` for the full, current list): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` (RS256 keypair), Cloudflare R2 credentials, Upstash Redis URL, Resend API key.

**Status: NOT EXECUTED** — no `.env` files exist in this environment; nothing was filled in or validated against a live service.

## 3. Supabase Setup
1. Create a Supabase project (or point `DATABASE_URL` at a local Postgres 15+ instance).
2. Copy the connection string into `backend/.env`'s `DATABASE_URL`.
3. Confirm the DB is reachable: `cd backend && pnpm db:studio` (or any `psql "$DATABASE_URL" -c '\dt'`).

**Status: NOT EXECUTED** — no network access in this sandbox; connectivity was never attempted.

## 4. Database Migrations
```bash
cd backend
pnpm db:migrate
```
**What was verified (static inspection):** `database/migrations/meta/_journal.json` correctly registers all 3 migrations (`0000_init`, `0001_sprint01_products_soft_delete`, `0002_equal_franklin_storm`) in order; `0002`'s SQL was diffed table-by-table against the current Drizzle schema files and matches (all 12 Sprint 2 tables present: `creator_addresses`, `creator_bank_details`, `creator_documents`, `creator_social_links`, `user_addresses`, `wishlist_items`, `cart_items`, `order_items`, `order_status_history`, `orders`, `reviews`, `notifications`).

**Status: Schema/journal consistency — PASS (static). Actual `pnpm db:migrate` run — NOT EXECUTED.**

## 5. Seed Data
```bash
pnpm db:seed        # roles, permissions, categories
pnpm db:seed:demo   # demo creators/products, optional
```
**What was verified:** `seed.ts`'s new Sprint 2 permissions (`categories:write`, `orders:manage`, `reviews:moderate`) are correctly added to both the `PERMISSIONS` array and the admin `ROLES` grant list; every `authorize(userId, 'x:y')` call added or touched this sprint uses a permission key that actually exists in `seed.ts`.

**Status: Permission/role consistency — PASS (static). Actual seed run — NOT EXECUTED.**

## 6. Backend Startup
```bash
cd backend && pnpm install && pnpm dev
```
**Status: NOT EXECUTED.**

## 7. Frontend Startup
```bash
cd frontend
npm install
npm run dev --workspace=apps/buyer     # port 3000
npm run dev --workspace=apps/creator   # port 3001
```
**Status: NOT EXECUTED.**

## 8. Authentication Testing

| Step | Preconditions | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Signup (buyer app) | Backend + frontend running | Better Auth account created, matching backend account created via bridge, verification email sent | — | **NOT RUN** |
| Signup with 10–11 char password | As above | Fixed this session (see FINAL_TEST_REPORT §1.2) — should now be rejected client-side (frontend schema now requires 12+) before ever reaching Better Auth | Code path traced and fixed; not run live | **NOT RUN (fix applied)** |
| Login | Verified account exists | Session cookie set (Better Auth) + backend JWT bridged into `dbk_refresh_token`/access-token flow | Cookie names, paths, and route wiring traced end-to-end in code (`access-token.ts` ↔ `cookies.ts` ↔ `session/bridge/route.ts`) and confirmed consistent | **NOT RUN (traced consistent)** |
| Protected API call | Logged in | Backend JWT verified via `jose` + RS256 public key; request succeeds | `getBackendAccessToken`/`requireAccessToken` usage confirmed across all BFF routes | **NOT RUN (traced consistent)** |
| Logout | Logged in | Better Auth session cleared + backend refresh token cleared (`session/clear/route.ts`) | Route exists and calls `clearBackendSession` | **NOT RUN (traced consistent)** |
| Session expiry / refresh | Access token expired | `/v1/auth/refresh` bridge silently renews | `refresh/route.ts` and `refresh-token.ts` exist and match the documented contract | **NOT RUN (traced consistent)** |
| Unauthenticated request to protected route | No session | 401 | Every route audited calls `authenticate(request)` before touching user data | **NOT RUN (traced consistent)** |

## 9. RBAC Testing

| Check | Expected | Actual | Status |
|---|---|---|---|
| `categories:write` required for category mutations | Only admin role (per seed) can create/update/delete/reparent categories | Confirmed in route + seed | **PASS (static)** |
| `orders:manage` required for admin order-status override | Confirmed in `admin/orders/[orderId]/status/route.ts` + seed | — | **PASS (static)** |
| `reviews:moderate` required for admin review deletion | Confirmed in `admin/reviews/[reviewId]/route.ts` + seed | — | **PASS (static)** |
| `creators:review` required for document approval | Confirmed in `admin/creators/[creatorId]/documents/[documentId]/review/route.ts` + seed | — | **PASS (static)** |
| Creator can only manage own store's products | **Was FAILING** — `requireStoreProductOwnership` never checked product↔store binding (13 routes). Fixed this session. | Fix applied and traced through all 13 call sites | **FIXED, NOT RE-RUN LIVE** |

## 10. API Testing
Every new Sprint 2 route was checked for: correct HTTP method, correct auth/authorize call order, Zod validation on the request body, and a matching frontend caller. See `FINAL_TEST_REPORT.md` §1 and §6 for the specific cross-references performed. **No live HTTP requests were made against a running server — NOT EXECUTED.**

## 11. Database Testing
Schema/migration consistency verified statically (Section 4). Foreign keys, cascade behavior (`onDelete: 'restrict'` on `orderItems.variantId` so historical orders can't be broken by a variant archive/delete), and soft-delete columns (`deletedAt`) spot-checked across `categories`, `products`, `productVariants`. **Constraint enforcement at the database level (actually attempting a violating write) — NOT EXECUTED.**

## 12. Creator Testing (Profile/Address/Bank/Social/Documents)
Verified in the earlier auth/creator WIP pass: schema, migration, encryption (`field-encryption.ts`, real AES-256-GCM, not a stub), routes, and frontend forms all present and consistent. **Live CRUD execution — NOT RUN.**

## 13. Category Testing
Create/update/delete/reparent all traced through service→repository→route→frontend (`CategoriesAdminClient.tsx`), including the one-level-of-nesting invariant and the "can't delete a category with subcategories or products" guard. **Live CRUD execution — NOT RUN.**

## 14. Product Testing
Create/update/publish/pause/archive/soft-delete traced end-to-end. The critical fix (§1.1 IDOR) directly affects this section — re-test authorization boundaries here specifically once you have a running environment. **Live CRUD execution — NOT RUN.**

## 15. Image Testing
Upload (presigned URL flow via `shared/storage/media-repository.ts`, shared between Product Images and Creator Documents), attach, reorder, delete traced through code. **Live upload against real R2 — NOT RUN** (would require real Cloudflare R2 credentials this sandbox doesn't have).

## 16. Variant Testing
New Sprint 2 CRUD (`createVariant`/`updateVariant`/`archiveVariant`) traced through service/repository/route/frontend (`ProductVariantManager.tsx`). SKU-uniqueness check and "can't archive the last active variant" guard both confirmed in `service.ts`. **Live CRUD execution — NOT RUN.**

## 17. Inventory Testing
New read endpoint (`getVariantInventory`) and existing adjust endpoint (`adjustVariantInventory`) both traced. Fixed a real bug this pass (§1.5 — error alert wired to the wrong hook instance). **Live adjustment against real DB — NOT RUN.**

## 18. Address Testing (User)
Full CRUD traced, correctly `userId`-scoped on every repository query (IDOR-safe). Removed dead/unused orphaned schema (§1.6). **Live CRUD execution — NOT RUN.**

## 19. Wishlist Testing
Add/remove/list traced. Fixed a real bug this pass (§1.4 — soft-deleted products weren't excluded from listings). **Live CRUD execution — NOT RUN.**

## 20. Cart Testing
Add/remove/update-quantity/get-cart traced. Confirmed the cart routes were correctly migrated off spoofable `session.id` onto real bearer-JWT auth during the earlier WIP pass. **Live CRUD execution — NOT RUN.**

## 21. Order Testing
Create (transaction-safe checkout with in-transaction stock validation), list, details, cancel (with restock) all traced through `orders/repository.ts`'s `checkoutFromCart`/`cancelOrder`. Fixed a real bug this pass (§1.3 — untyped 500 on bad shipping address). **Live checkout execution — NOT RUN.**

## 22. Review Testing
Create (verified-purchase check), update, delete, admin moderation, rating recalculation, creator notification-on-review all traced. No bugs found. **Live CRUD execution — NOT RUN.**

## 23. Notification Testing
List, mark-read, mark-all-read, delete all traced, correctly `userId`-scoped. Cross-module `notify()` helper (used by Orders and Reviews) confirmed sound. No bugs found. **Live execution — NOT RUN.**

## 24. Integration Testing
Cross-module seams checked: order-cancel → inventory restock (correct signed-delta pattern), review-create → creator notification (correct), creator-approval → store row creation (transactional, correct), RBAC seed permissions → route `authorize()` calls (every key used actually exists and is granted). No integration-level bugs found beyond the module-level ones already listed. **Live multi-step flow execution — NOT RUN.**

## 25. Security Testing

| Check | Result |
|---|---|
| Unauthenticated access blocked | Every audited route calls `authenticate()` before data access — **PASS (static)** |
| Creator A cannot modify Creator B's resources | **Was FAILING** (§1.1) — fixed this session, all 13 affected routes patched — **FIXED, needs live re-verification** |
| User A cannot access User B's addresses/wishlist/orders/notifications | All repository queries scope by `userId` — **PASS (static)** |
| Client cannot spoof user ID | Auth derives `userId` from the verified JWT, never from a request body/param — **PASS (static)** |
| Client cannot spoof creator/store ownership | Was the exact vector in §1.1; now fixed — **FIXED, needs live re-verification** |
| Admin-only endpoints protected | RBAC permission checks confirmed present and correctly seeded — **PASS (static)** |
| Input validation | Zod schemas present on every mutation route audited — **PASS (static)** |
| SQL injection | All queries go through Drizzle's parameterized query builder; no raw string-interpolated SQL found in any audited module — **PASS (static)** |
| Sensitive data not exposed | Bank account details use real AES-256-GCM encryption, never echoed back in full — **PASS (static)** |
| Rate limiting | `enforceRateLimit()` called on every audited route — **PASS (static)** |
| **Live penetration-style testing (actually attempting cross-user/cross-creator requests against a running server)** | **NOT EXECUTED** — do this before considering §1.1's fix trustworthy in production |

## 26. Error / Edge-Case Testing
Traced: empty cart checkout (`EmptyCartError`), stock-changed-mid-checkout (`CartItemStockChangedError`), invalid shipping address (fixed, §1.3), archiving a product's last active variant (blocked), re-parenting a category into itself (blocked), re-parenting into a 3rd nesting level (blocked). **Live triggering of these paths — NOT RUN.**

## 27. Responsive UI Testing
**NOT EXECUTED** — no browser/rendering environment available in this sandbox.

## 28. Regression Testing
No previously-working functionality was intentionally altered; every fix in this pass either tightened a security boundary, corrected an error type, added a missing filter, fixed dead error-handling code, or removed genuinely dead/unused code. **Full regression suite run — NOT EXECUTED** (see `backend/src/modules/products/__tests__/schemas.test.ts` and `backend/src/modules/creators/__tests__/` for existing unit tests, whose actual pass/fail status is unknown without running them).

## 29. Lint Verification
**NOT EXECUTED.** `npm run lint` (frontend) / `pnpm lint` (backend) need to be run in an environment with dependencies installed.

## 30. Typecheck Verification
**NOT EXECUTED.** Every edit this session was written to match the existing type signatures in context (e.g. `ShippingAddressNotFoundError extends NotFoundError`, `getProductStoreId(): Promise<string | null>`), but none were compiler-checked. Run `npm run typecheck` / `pnpm typecheck` before trusting this.

## 31. Unit Test Verification
**NOT EXECUTED.** `pnpm test` (backend) / `npm test` (frontend) need to be run.

## 32. Production Build Verification
**NOT EXECUTED.** `npm run build` (frontend, both apps) / `pnpm build` (backend) need to be run.

---

## Summary

Everything under "Status: PASS (static)" or "traced consistent" reflects genuine source-code verification performed this session — not a guess, and not carried over from prior unverified documentation. Everything marked **NOT EXECUTED** or **NOT RUN** genuinely wasn't, because this environment cannot install dependencies, reach a network, or run a database. The single most important thing to actually execute before shipping is **Section 25's live re-verification of the §1.1 IDOR fix** — run it as an actual cross-creator authorization test against a running server before trusting that fix in production.
