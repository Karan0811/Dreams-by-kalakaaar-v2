# Performance investigation and fix report

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

## Changes made

- BFF authorization now reads the backend access-token cookie directly. The
  backend remains the authorization boundary and verifies the token on every
  protected request; the redundant `/auth/me` bridge call is gone.
- Add-to-cart now loads the cart line, product, variant, and inventory in one
  joined query, reducing the read phase from two queries to one.
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
present in a vanilla local PostgreSQL instance.

## Validation

- Backend typecheck: **passed**
- Backend tests: **11 files, 100 tests passed**
- Backend lint: **0 errors, 1 existing warning** in
  `src/scripts/assign-admin.ts` (`env` unused)
- Buyer typecheck via Turborepo: **passed**
- Buyer, creator, and shared frontend package TypeScript checks: **passed**
- Changed frontend files ESLint: **passed**
- Buyer production build: compilation **passed**, but the command exceeded the
  environment's 5-minute execution limit during the later build phase.
- Backend production build: command exceeded the environment's 5-minute
  execution limit while Next.js was building; typecheck and tests passed.

No live Supabase benchmark was possible in this sandbox because the uploaded
project did not include a running application, database, or Redis connection.
The new production logs expose the remaining deployed timing split directly:
`authenticateMs`, `rateLimitMs`, `serviceMs`, and `totalHandlerMs` for cart,
plus the existing catalog `rateLimitMs`, `serviceMs`, and
`totalHandlerMs`.