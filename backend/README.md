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
npm install
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
npm run db:generate   # regenerate migrations after a schema change
npm run db:migrate    # apply database/migrations/*.sql to DATABASE_URL
npm run db:seed       # populate the baseline RBAC catalog (roles/permissions)
npm run db:studio     # Drizzle Studio, a GUI over your database
```

Migrations live in `../database/migrations` (this repository's designated
home for schema artifacts), not inside `backend/` itself — see
`drizzle.config.ts`'s doc comment for why.

## Running

```bash
npm run dev       # http://localhost:3000, Turbopack
npm run build     # production build
npm run start     # run the production build
```

## Verification

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run test        # vitest
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

## API documentation

`../api/openapi/v1.yaml` — OpenAPI 3.0 spec for every endpoint implemented
in this phase. Full documented contract (including endpoints not yet
built) is `../docs/09-api-architecture.md`.

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
