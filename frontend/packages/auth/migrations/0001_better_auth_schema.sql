-- Better Auth's own schema — separate from the marketplace's application
-- schema (backend/src/shared/db/schema/), and from the backend's own
-- separate Better Auth instance (backend/src/shared/auth/better-auth.config.ts).
-- This one backs the FRONTEND's session (packages/auth/src/better-auth.config.ts,
-- shared by apps/buyer and apps/creator).
--
-- Generated via: npx @better-auth/cli generate (see frontend/README.md's
-- "Auth database setup" section for the exact command, since the CLI can't
-- resolve the config file with its `import "server-only"` lines present —
-- that section documents the temporary-copy workaround).
--
-- Apply once per environment before relying on sign-up/sign-in/password-reset:
--   psql "$DATABASE_URL" -f packages/auth/migrations/0001_better_auth_schema.sql
--
-- Safe to re-run (IF NOT EXISTS on every statement).

create table if not exists "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null, "roles" text, "hasCreatorProfile" boolean);

create table if not exists "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

create table if not exists "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table if not exists "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create index if not exists "session_userId_idx" on "session" ("userId");

create index if not exists "account_userId_idx" on "account" ("userId");

create index if not exists "verification_identifier_idx" on "verification" ("identifier");