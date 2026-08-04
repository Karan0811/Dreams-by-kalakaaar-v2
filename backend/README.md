# Dreams by Kalakaaar v2 — Backend

Next.js 15 (App Router) Route Handlers, Drizzle ORM against Supabase
PostgreSQL, Better Auth for identity — implementing
`docs/10-backend-architecture.md`'s Phase 1 (see `SCOPE.md` in this folder
for exactly what's built vs. deferred, and why).

## Requirements

- Node.js ≥ 20
- A PostgreSQL 16 database (local via Docker, or a Supabase project)
- An Upstash Redis database (rate limiting; see below for local dev without one)

## Setup

```bash
cd backend
pnpm install
cp .env.example .env.local
```

Edit `.env.local`:

- `DATABASE_URL` — point at your local Postgres or Supabase connection string
- `BETTER_AUTH_SECRET` — any random 32+ byte string (`openssl rand -hex 32`)
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — an RSA keypair, PEM-encoded, with
  literal `\n` for newlines (generate one with:
  `node -e "const{generateKeyPairSync}=require('crypto');const{publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});console.log(privateKey);console.log(publicKey)"`)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — from an Upstash
  Redis database (free tier is enough for local dev)

Everything else has a sane default or is optional until you need that
integration (email, R2, Razorpay, etc. — see comments in `.env.example`).

## Database

```bash
pnpm run db:generate    # regenerate migrations after a schema change
pnpm run db:migrate     # apply database/migrations/*.sql to DATABASE_URL
pnpm run db:seed        # populate the baseline RBAC catalog (roles/permissions) — required, run first
pnpm run db:seed:demo   # populate realistic demo data (Sprint 01) — optional, run after db:seed
pnpm run db:studio      # Drizzle Studio, a GUI over your database
```

Migrations live in `../database/migrations` (this repository's designated
home for schema artifacts), not inside `backend/` itself — see
`drizzle.config.ts`'s doc comment for why.

**Migration Guide**: `pnpm run db:migrate` applies every `.sql` file under
`../database/migrations/` that isn't already recorded in the
`drizzle.__drizzle_migrations` tracking table, in order. To add a schema
change: edit the relevant file in `src/shared/db/schema/`, run
`pnpm run db:generate` (prompts for a migration name), review the generated
`.sql` before committing it, then `pnpm run db:migrate`. Never hand-edit a
migration file that's already been applied anywhere — generate a new one
instead. **A migration file existing on disk is not sufficient** — verify
`database/migrations/meta/_journal.json` actually lists it (this sprint
found and fixed a case where it didn't, silently, and the migration had
never applied anywhere as a result). A quick sanity check after any
migration work: `psql $DATABASE_URL -c '\d products'` and confirm the
columns you expect are actually there.

**Seed Guide**: `pnpm run db:seed` is required in every environment — it's
the RBAC permission/role catalog the authorization middleware depends on,
not optional demo content. `pnpm run db:seed:demo` (Sprint 01) is optional,
idempotent (safe to re-run — every insert is conflict-checked against a
natural unique key and skipped if present), and populates 8 categories, 8
creators/stores, 18 products with realistic Indian handmade-marketplace
data, and 5 buyer accounts — see `src/scripts/seed-demo-data.ts`'s own doc
comment for exactly what it does and does not seed. Every seeded account's
password is `DemoPass123!` (not a production credential — this is
demo-only, local/staging data).

**Database Reset** (local dev only — destroys all data):
```bash
psql "$DATABASE_URL" -c 'DROP SCHEMA public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;'
pnpm run db:migrate
pnpm run db:seed
pnpm run db:seed:demo   # optional
```

## Running

```bash
pnpm run dev       # http://localhost:3000, Turbopack
pnpm run build     # production build
pnpm run start     # run the production build
```

## Verification

```bash
pnpm run typecheck   # tsc --noEmit
pnpm run lint        # eslint .
pnpm run test        # vitest
curl http://localhost:3000/api/v1/health         # liveness
curl http://localhost:3000/api/v1/health/ready   # Postgres + Redis check
```

Every piece of this phase — schema, migrations, Better Auth wiring,
Argon2id hashing, JWT issuance/verification, refresh-token rotation, field
encryption, the RBAC seed data, and a full
register → apply-as-creator → create-product → publish-rejected-without-media
flow — was run against a real local PostgreSQL instance during
development, not just written and assumed to work. See `SCOPE.md` for the
one dependency (Upstash Redis) that could only be verified against the SDK's
documented contract rather than a live instance in that environment.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string (local or Supabase) |
| `BETTER_AUTH_SECRET` | Yes | Session signing secret — `openssl rand -hex 32` |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | Yes | RSA keypair for this backend's own short-lived access tokens (see generation command above) — distinct from Better Auth's own session, not interchangeable with it |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Yes | Rate limiting backend |
| `R2_*` (account id, access key, secret key, bucket, public URL) | Only for Product Images | Presigned upload target — `shared/storage/r2-client.ts`. Without these, product creation/CRUD still works; the media upload-url endpoint will fail |
| `RAZORPAY_*` | Not yet | Reserved for Checkout (undelivered module) |
| Email provider vars | Not yet | Password reset/verification emails are logged, not sent, until an email provider is wired up (`SCOPE.md`) |

Full list with inline comments: `.env.example`. Never commit `.env.local`
(already gitignored).

## Deployment

This is a standard Next.js App Router application — deploy it as its own
Vercel project (or any Next.js-compatible host) with `backend/` as the
project root, not the repository root. Before this sprint, the OpenAPI
spec lived outside `backend/` entirely and would not have shipped with
that deployment shape; it's now correctly inside `backend/openapi/`.

1. Set every required environment variable above in your host's dashboard.
2. Run `pnpm run db:migrate` and `pnpm run db:seed` against the production
   database as a one-off deploy step (not automatically on every deploy —
   review generated migrations before applying them to production data).
3. `pnpm run build` then `pnpm run start` (or let the host run these).
4. Verify: `curl https://<your-domain>/api/v1/health/ready` (checks
   Postgres + Redis connectivity) and `https://<your-domain>/api/docs`
   (Swagger UI loads).
5. Do not run `pnpm run db:seed:demo` against production — it's
   local/staging demo data with a published, shared password.

`openapi/v1.yaml` — OpenAPI 3.0 spec for every endpoint implemented
in this phase, served at runtime via `/api/docs` (Swagger UI),
`/api/openapi.json`, and `/api/openapi.yaml`. Full documented contract
(including endpoints not yet built) is `../docs/09-api-architecture.md`.

## Project structure

See `docs/10-backend-architecture.md` §4.1 for the full rationale. Summary:

```
src/
  app/api/v1/<domain>/route.ts   Route Handlers — HTTP only, no business logic
  modules/<domain>/
    schemas.ts                    Zod input validation
    errors.ts                     Domain-specific error subclasses
    repository.ts                 Raw Drizzle queries — no business rules
    service.ts                    Business logic — the only thing route.ts calls
  shared/                         Cross-cutting: db, auth, authz, config,
                                   errors, middleware, observability, etc.
  scripts/                        migrate.ts, seed.ts (see scripts/ at the
                                   repo root for the thin wrappers that
                                   invoke these)
```

## Sprint 01 — Products module

Extends the Products module (previously create/read/publish only) with:
search, structured filters, sort, page-number pagination for price/
popularity sorts, soft delete, Product Images (presigned R2 upload — the
first real consumer of `shared/storage/r2-client.ts`), and Inventory
Management (signed-delta adjustment, never a raw overwrite). Also fixes
several bugs found while building this — most significantly, a corrupted
`database/migrations/meta/_journal.json` meant the products soft-delete
migration had silently never applied anywhere, on any database anyone ran
these migrations against, despite the `.sql` file itself being correct.
Found and fixed by installing a real local Postgres specifically to verify
this sprint's seed data, which surfaced it immediately. See `../CHANGELOG.md`
for the complete list and `docs/testing/sprint-01-production.md` for the
full manual test checklist.

Also added: `src/scripts/seed-demo-data.ts` (realistic Indian
handmade-marketplace demo data), structured logging at every real Products
mutation (previously this module had none, despite the logger
infrastructure existing), and a fix for a genuinely swallowed error in the
media-cleanup path.

**Known gap, not introduced by this sprint but blocking full creator-side
verification:** the frontend's Better Auth session and this backend's
`authenticate()` middleware are two independent, unbridged auth systems —
see `frontend/packages/auth/src/access-token.ts`'s doc comment. Every
Products endpoint documented here works and is verified via the OpenAPI
spec, this repo's own test suite, and — this session — a real running
server against real seeded Postgres data (search, sort, pagination, and
product detail with working image URLs all confirmed live). What isn't yet
verified is a live browser session calling it end-to-end from the creator
app, because no frontend login flow currently produces a token this
backend's `authenticate()` middleware accepts.
