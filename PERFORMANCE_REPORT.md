# Complete end-to-end performance audit and fix report

Audit scope: buyer and creator frontend flows, BFFs, backend Route Handlers,
services/repositories, Postgres, Redis, authentication/RBAC, storage calls,
error/retry behavior, and production validation. The audit used the actual
Next.js backend locally and the connected Supabase project's public catalog
data. Private Supabase tables are intentionally not exposed by its anon key,
so buyer/creator account data and production backend timings could not be
replayed against that database without a service-role-backed application
runtime.

## What was slowing the buyer experience

### Add to Cart

An authenticated buyer BFF request called `getServerSession()` before reading
the access-token cookie. `getServerSession()` calls the backend `/auth/me`
endpoint, which performs JWT verification, Redis rate limiting, a user lookup,
and RBAC permission loading. The cart request then performed its own JWT and
Redis checks. This made every authenticated cart request pay for a second
backend request that did not provide any additional authorization.

The add flow also used three sequential database operations:

1. Find the existing cart line.
2. Find the variant and inventory.
3. Update or insert the cart line.

After a successful browser mutation, React Query invalidated the cart and
issued another cart GET. That was correct but needlessly added another complete
BFF/backend/rate-limit/database path when the mutation response already had
enough information to update the cache.

### Catalog and product detail

The server API client attached a new random `X-Correlation-Id` header to every
request, including cacheable catalog GETs. In Next.js, request headers are part
of the fetch cache/memoization key, so this defeated the configured 60-second
catalog and 300-second detail cache and prevented metadata/page request
deduplication.

The public listing also lacked indexes matching its most common active,
non-deleted cursor predicate and its variant price aggregate.

### Remaining buyer and creator flows

The broader pass found several additional issues independent of the original
Cart/Catalog delay:

- Home fetched the default 20-product page and discarded 12 cards. Related
  Products did the same before discarding all but four cards.
- Wishlist and address mutations invalidated and refetched full collections
  after successful writes, despite already receiving the changed item.
- Order detail loaded order items and status history sequentially even though
  both depend only on the already-loaded order.
- Order history had separate `user_id` and `created_at` indexes, but not the
  common `(user_id, created_at DESC)` access path.
- Checkout loads cart and addresses and now places a real order (Sprint 02
  Phase 2, merged separately from this audit): `checkoutFromCart` re-reads
  the cart inside one transaction, re-validates stock/availability, prices
  every line from the database, and takes a `FOR UPDATE` lock on the
  buyer's cart rows to prevent a double-click/duplicate-submit race from
  creating two orders. No payment provider is integrated yet — orders are
  created directly in `PENDING` — but this is no longer a permanently
  disabled action.
- Creator dashboard pending-actions/performance calls have no backend routes,
  and their BFF calls send `X-User-Id` instead of the bearer token expected by
  protected backend routes. Creator dashboard, orders, messages, and several
  linked buyer category/storefront routes are therefore not end-to-end
  testable in this codebase.
- The RLS migration referenced optional legacy tables named `user`, `session`,
  `account`, and `verification` that are not created by the current migrations.
  On a clean database this blocked the security migration before any RLS
  policy could be installed.

## Changes made

- BFF authorization now reads the backend access-token cookie directly. The
  backend remains the authorization boundary and verifies the token on every
  protected request; the redundant `/auth/me` bridge call is gone.
- Add-to-cart now loads the cart line, product, variant, and inventory in one
  joined query, reducing the read phase from two queries to one.
- Cart quantity updates now use the same joined read pattern keyed by cart-line
  ID, reducing their validation phase from two sequential reads to one.
- Add-to-cart returns the complete cart entry from that joined row.
- Add, update, and remove mutations now reconcile the React Query cart cache
  directly instead of invalidating and immediately refetching the cart.
- Cart query freshness is 30 seconds; mutation responses remain the source of
  immediate UI updates.
- Session display requests are shared between concurrent client consumers and
  refreshed after auth actions, preventing duplicate `/api/session/me` calls
  from the shop chrome and product detail components.
- Cacheable server GETs no longer receive a random correlation header. Mutating
  and `no-store` requests keep per-request correlation IDs.
- Product detail metadata and page rendering share a React server-side cached
  product lookup.
- Added migration `0004_catalog_performance_indexes.sql` with active catalog
  cursor, category cursor, variant-price, media-order, and trigram search
  indexes.
- Updated frontend Next.js from 15.1.4 to 15.5.22 so the validation install is
  not blocked by the old package's security policy. Added a pnpm override for
  `fast-xml-parser` 4.5.3.
- Added structured cart timing logs for authentication, Redis rate limiting,
  cart service, and total handler time. Existing product timing logs remain in
  place.
- Added a `limit` parameter to the shared frontend product-list contract and
  made Home and Related Products request only the cards they render.
- Wishlist and address mutations now reconcile React Query cache entries on
  success rather than issuing a follow-up collection GET. Failed mutations no
  longer invalidate healthy cached data.
- Order detail items/history now run concurrently after the parent lookup.
- Added migration `0005_order_list_composite_index.sql` for buyer order
  history.
- Made optional legacy Better Auth table RLS statements conditional, so
  migration `0003_rls_defense_in_depth.sql` succeeds on the current schema.
- Replaced the repeated correlated variant `min(price_amount)` subquery on
  price-filtered/sorted page-number listings with one grouped variant
  aggregate joined to the product query. Cursor/newest/best-selling paths are
  unchanged; no denormalized price column or write-time consistency mechanism
  was introduced.

## Measured results

### Request/round-trip reduction

These are measured from the code path, not synthetic timing claims:

| Flow | Before | After |
| --- | ---: | ---: |
| Authenticated add BFF → backend requests | 2 (including redundant `/auth/me`) | 1 |
| Add cart read queries before write | 2 | 1 |
| Successful add browser/BFF requests | POST + cart GET | POST only |
| Concurrent shop session consumers | one `/api/session/me` each | one shared request |
| Product detail lookup during one render | metadata + page fetch | one shared lookup |

### Local PostgreSQL plan benchmark

A local PostgreSQL 16.10 database was populated with 25,000 active products and
50,000 active variants. With the new catalog cursor index disabled, the
default active catalog query took **0.083 ms** on a warm local database and
used an incremental sort. With
`products_public_created_cursor_idx` enabled, it took **0.031 ms** and used
the partial index directly. This is a query-plan sanity check, not a promise
of production latency; Supabase network, connection setup, data size, and
cache state must still be measured in the deployed environment.

The new migration was applied successfully to that local database. The
project's existing RLS migration was not applied in this isolated database
because it expects Supabase roles (`anon` and `authenticator`) that are not
present in a vanilla local PostgreSQL instance. After creating those roles,
the corrected migration applied successfully; 37 local tables had RLS enabled
and the new order index was present.

The same local dataset was also used to compare the old and new price ordering
shape. A warm `priceLow` page with a minimum-price filter took
**77.3 ms** with the repeated correlated subquery and **35.7 ms** with the
single grouped aggregate join (about **54% less database plan time**). This
justified the narrowly scoped rewrite above. It is still a local plan
benchmark, not a production latency promise.

### Connected Supabase catalog probe

The connected Supabase project exposed 18 active, non-deleted products through
its public catalog tables. A public catalog projection returned 18 rows and
8,358 bytes at `limit=20`; the same projection returned 8 rows and 3,584 bytes
at `limit=8` — a 57% payload reduction for the home-page-sized request. A
title search returned 2 rows/569 bytes. Private tables such as `users`,
`cart_items`, `wishlist_items`, `orders`, and `inventory` correctly returned
permission errors for the stored anon key, so those reads were not treated as
production measurements.

### Actual local application run

The Next.js backend was started with isolated PostgreSQL and a Redis-compatible
test server. `/api/v1/health` returned 200 in 0.29s. After the route compiled,
`GET /api/v1/products?limit=8` returned 200 in 9.96s on its first request
(7.5s route compilation plus 0.26s handler work), and a repeated request
returned 200 in 1.38s (0.59s handler time in the structured log). The
structured product log split the repeated request into approximately 0.57s
Redis rate-limit time and 0.018s service time. This confirms that development
route compilation is not application latency, while Redis/network overhead is
visible in the handler budget. The isolated Redis shim could not exercise the
full production Redis implementation; no production Redis latency claim is
made. A later clean run with the local shim measured the price-filtered route
at **467 ms handler time**: approximately 91 ms rate limiting, 326 ms service
work, and 258 ms for the product page/count query plus 49 ms enrichment. The
page returned HTTP 200.

### Authenticated Cart run

The backend was run with a real RS256 JWT (matching the local key pair), the
actual authentication middleware, the actual Cart service/repository, local
PostgreSQL, and a Redis-compatible rate-limit server. A seeded buyer/user,
active variant, and inventory row exercised the full protected backend path.
The structured handler measurements below exclude Next.js development route
compilation and are therefore more useful than the client-observed first
request:

| Operation | HTTP | Authenticate | Rate limit | Service | Handler total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Cart GET (empty) | 200 | 24 ms | 112 ms | 235 ms | 371 ms |
| Cart POST/add | 201 | 109 ms | 77 ms | 268 ms | 454 ms |
| Cart PATCH/update | 200 | 149 ms | 46 ms | 42 ms | 237 ms |
| Cart DELETE/remove | 204 | — | — | — | — |

The DELETE response completed successfully, but its structured log was emitted
after the short-lived development process was stopped, so it is not presented
as a timing measurement. The POST response included the complete cart entry;
the client did not need a follow-up cart GET. The first GET/POST client
round-trips were 8.0 s/7.1 s because the development server compiled routes
on demand; subsequent requests were sub-second to low-single-digit seconds at
the client boundary, with the handler timings above.

The standalone rate-limit probe against the same local shim was about 4–16 ms
warm and about 103 ms on first use. The earlier roughly 570 ms observation,
and an isolated development run that reached roughly 800 ms during concurrent
route compilation, were not Redis command time: they include local runtime
scheduling, initialization, and/or compilation overlap. Production Redis
latency will depend on the deployed Redis region and network path and must be
verified with production telemetry.

## Validation

- Backend typecheck: **passed**
- Backend tests: **11 files, 100 tests passed**
- Backend lint: **0 errors, 1 existing warning** in
  `src/scripts/assign-admin.ts` (`env` unused)
- Buyer typecheck via Turborepo: **passed**
- Buyer, creator, and shared frontend package TypeScript checks: **passed**
- Buyer ESLint: **passed with 51 pre-existing warnings, 0 errors**
- Backend RLS migration with Supabase roles: **passed**
- New order composite index migration: **passed**
- Buyer production build: optimized compilation **passed in 12.7s**, but the
  command exceeded the environment's 5-minute execution limit during later
  static-generation/build-worker work.
- Creator production build: optimized compilation **passed in 22.8s**, but the
  command exceeded the environment's 5-minute execution limit during later
  build work.
- Backend production build: Next.js build worker was terminated by the
  environment with `SIGKILL` after starting the optimized build; typecheck,
  lint, tests, and route compilation passed.

The connected Supabase database is reachable for public catalog probes, but the
application itself still needs a deployed/runtime `DATABASE_URL`, Redis, R2,
email, and payment configuration to reproduce authenticated production flows.
The new production logs expose the remaining deployed timing split directly:
`authenticateMs`, `rateLimitMs`, `serviceMs`, and `totalHandlerMs` for cart,
plus the existing catalog `rateLimitMs`, `serviceMs`, and
`totalHandlerMs`.

## Overall assessment

The original 15–20 second Cart symptom had multiple avoidable hops: a
redundant session/backend call, a two-query read phase, and a post-mutation
cart refetch. Those paths are now reduced to one authenticated backend request,
one joined read, and cache reconciliation. The remaining meaningful runtime
risk is service/network overhead — especially Redis and the remote Postgres
connection — rather than the fixed local query work. The wider application is
not yet a complete marketplace: order placement now works end-to-end
(cart → checkout → order, no payment provider), but real payment capture and
the creator dashboard surfaces are intentionally incomplete and must be
finished before a true production buyer/creator acceptance run can pass.