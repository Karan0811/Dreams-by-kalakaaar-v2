# Phase 1 Scope — Dreams by Kalakaaar v2 Backend

This document exists because the docs in `/docs` describe the **complete,
final** backend (26 domains, dozens of endpoints, background jobs, full
observability stack). Building all of it in one pass isn't realistic or
honest work — this document says exactly what was actually built in this
phase, what was deliberately deferred, and why, so nothing is silently
half-implemented or passed off as more complete than it is.

Every deferral below follows the same rule: **build the foundation
correctly and completely, rather than stub out everything shallowly.**

## What's implemented (production-quality, no placeholders)

### Foundation
- Next.js 15 App Router project matching `10-backend-architecture.md`
  §4.1's folder hierarchy exactly (`src/app/api/v1`, `src/modules`,
  `src/shared`, `src/jobs`, `src/lib`)
- Typed, Zod-validated environment configuration (`shared/config/env.ts`)
- The full error taxonomy from §18.2 (`shared/errors/base-errors.ts`)
- Structured Pino logging with automatic secret redaction
- The complete middleware pipeline from §6.1: correlation ID → logging →
  rate limiting → authentication → authorization → validation → the
  terminal error handler — composed via `shared/middleware/compose.ts`'s
  `withRouteHandler` wrapper so every route file is small and consistent
- Response envelope builders matching §2.15–2.16 exactly (single resource
  at the root; collections as `{ data, pagination }`; one error shape
  everywhere)

### Database (Drizzle ORM against Supabase PostgreSQL)
Full schema for 7 of the 26 documented domains — chosen as exactly the set
the Auth/Users/Creators/Products modules below need:
- **Identity** (`08-database-design.md` §5) — complete: Users,
  UserProfiles, AuthenticationAccounts, Sessions, RefreshTokens,
  EmailVerifications, PasswordResets, Devices
- **Authorization/RBAC** (§6) — complete: Roles, Permissions,
  RolePermissions, UserRoles, ResourcePermissions, PermissionAudits
- **Marketplace** (§7) — partial: Creator, Store, StoreVerification only
  (see "Deferred" below for the rest)
- **Categories** (§10) — partial: the `Category` table only
- **Media** (§22) — partial: the durable `media` reference row only
- **Inventory** (§9) — partial: the per-variant stock row only
- **Product** (§8) — partial: Product, ProductVariant, ProductMedia,
  ProductCategory only

All migrations were generated with `drizzle-kit generate` and **applied to
a real local PostgreSQL 16 instance during development** — not just
written and assumed correct.

### Authentication
- Better Auth wired onto this project's own Identity schema (not Better
  Auth's default table shapes) via `shared/auth/better-auth.config.ts`'s
  field-mapped Drizzle adapter — validated by actually calling
  `auth.api.signUpEmail`/`signInEmail` against Postgres, not by reading
  Better Auth's source and guessing
- Argon2id password hashing (`shared/auth/password.ts`), replacing Better
  Auth's scrypt default, per `12-security-architecture.md` §5.2
- Short-lived RS256 JWT access tokens (`shared/auth/jwt.ts`) layered on top
  of the Better Auth session, per `09-api-architecture.md` §3.1's
  stateless-verification rationale
- Rotating, hashed, single-use refresh tokens with reuse detection
  (`shared/auth/refresh-token.ts`)
- HIBP k-anonymity breached-password screening
  (`shared/auth/breach-check.ts`)
- AES-256-GCM field-level encryption for sensitive columns (e.g. a
  Creator's tax identifier), per `08-database-design.md` §29.1

### Modules (schema / repository / service / route handlers, each)
- **Auth**: register, login, logout, refresh, me, change-password,
  forgot-password, reset-password, verify-email
- **Users**: get/update my profile
- **Creators**: apply (creates Creator + draft Store transactionally),
  get my application
- **Products**: create, get, update, publish/pause/archive (with a real
  publish-readiness check — at least one photo, every variant has an
  inventory row), creator-side listing, public listing, public detail

### Cross-cutting
- RBAC repository + `authorize`/`authorizeOwnerOrPermission` middleware,
  re-checking permissions from Postgres on every request rather than
  trusting the JWT's embedded role snapshot (§5.3 — roles can be revoked
  mid-token-lifetime)
- Upstash Redis client + tiered rate limiting (`shared/middleware/rate-limit.ts`)
- Resend email client (verification + password-reset emails)
- Cloudflare R2 (S3-compatible) storage client — the primitive, not yet
  wired into any route (see Deferred)
- Health endpoints: `/v1/health` (liveness), `/v1/health/ready`
  (Postgres + Redis), `/v1/health/deep` (operator-only, timed)
- RBAC seed script (`backend/src/scripts/seed.ts`, run via `npm run
  db:seed`) and a migration runner (`npm run db:migrate`)
- OpenAPI 3.0 spec for every endpoint above (`openapi/v1.yaml`, served at `/api/docs`)

## Deliberately deferred (documented in `/docs`, not built yet)

Each of these is a real, sized module in its own right — building a
shallow version of all of them would mean nothing here actually works.
Better to build fewer things completely.

| Area | Where it's documented | Why deferred |
|---|---|---|
| StoreBranding, StorePolicy, StoreTeam, StoreInvitation, StoreSettings, StoreSocialLinks, StoreFAQ, StoreAnnouncement, StoreAnalytics | `08-database-design.md` §7.3-7.13 | Full Stores module is its own build phase (`10-backend-architecture.md` §5.5); Creators/Products only needed the Store row itself to exist |
| ProductSpecification, ProductDisclosure, ProductSEO, ProductAnalytics, ProductStatusHistory, ProductVersion, ProductDraft, ProductApproval, ProductRecommendation, CustomizationOption/Value, ProductMaterial/Technique, ProductTag | §8.6-8.18 | Basic CRUD + publish was this phase's explicit scope; these are the Products module's *advanced* features |
| Media processing pipeline (resize/transcode, moderation, variants) | §22, `10-backend-architecture.md` §11 | The storage primitive (`shared/storage/r2-client.ts`) exists; no route calls it yet — product photo upload is the natural first consumer and belongs with a real Media module build |
| Collections, Occasions, Festivals, GiftGuides, NavigationNode, Tag, Material, Technique | §10 (rest of Categories domain) | Only `Category` itself was a hard dependency for Products |
| Cart, Checkout, Orders, Payments, Shipping, Reviews, Wishlist, Search, Messaging, Notifications, CMS, Moderation, Support, Analytics, feature flags, API keys | Various | Entirely separate modules not in this phase's brief |
| Background jobs (Inngest) | `10-backend-architecture.md` §12 | No job-worthy async workflow exists yet in this phase's feature set |
| Moderator / Support Executive roles + their permissions | `08-database-design.md` §6 | No module in this phase has an endpoint those roles would use |

## Known, intentional trade-offs (not bugs — documented so they're not mistaken for oversights)

- **Better Auth's write and this module's provisioning writes
  (UserProfile, default Role grant) are not one atomic transaction.**
  Better Auth's Drizzle adapter owns its own connection; it isn't handed
  this app's transaction handle. If the profile/role step fails after
  Better Auth's user row is created, this is logged loudly
  (`modules/auth/service.ts`) rather than silently swallowed. A future
  hardening pass could add a reconciliation job that finds
  users-without-profiles and repairs them.
- **Logging out only blocks the refresh token immediately; the current
  access token remains valid until it naturally expires (up to 15
  minutes).** This is the standard, intentional trade-off of stateless
  JWT access tokens (`09-api-architecture.md` §3.1's own stated rationale
  for choosing them) — the alternative (checking token validity against
  Postgres on every request) is exactly the round-trip this design avoids.
- **Email/password-reset verification does not go through Better Auth's
  own generic `verification` table.** That table
  (`better_auth_verifications` in `identity.ts`) exists only so Better
  Auth's schema contract is satisfied; this project's own richer
  `emailVerifications`/`passwordResets` tables (with attempt counts and
  requesting-IP, which Better Auth's generic model lacks) are what the
  Auth module actually reads and writes.
- **`authenticationAccounts.provider` is a `varchar`, not a Postgres
  enum**, because Better Auth (not this schema) owns that value's
  vocabulary (`"credential"`, `"google"`, `"apple"`) — this was discovered,
  not assumed, by running a real sign-up against the schema and observing
  what Better Auth actually wrote.
- **Password policy**: `12-security-architecture.md` §5.2 (12-char
  minimum, no complexity-class rule, breach screening) was followed over
  `09-api-architecture.md` §3.2's conflicting "10 characters, letter +
  number" text, because the API doc's own text defers "the specific
  policy" to Security, and Security gives a reasoned argument for
  rejecting complexity rules. This conflict exists in the source
  documents themselves and is worth reconciling there.
