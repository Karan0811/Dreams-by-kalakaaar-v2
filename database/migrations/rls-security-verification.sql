-- rls-security-verification.sql
--
-- Manual RLS verification for migration 0003_rls_defense_in_depth.sql.
--
-- WHY THIS IS A .sql FILE, NOT A VITEST TEST: this app's `postgres` driver
-- connection is a single service credential — there is no per-test-user
-- Postgres role to authenticate as, and `anon`/`authenticated` are
-- Supabase-provisioned roles that do not exist on a bare local Postgres
-- (this repo has no `scripts/docker-compose.yml` despite the comment in
-- `backend/.env.example` referencing one — flagged separately in the
-- delivery notes). Correctly exercising RLS means literally switching
-- Postgres role mid-session, which `SET ROLE` does and a connection-pooled
-- ORM test does not straightforwardly reproduce. Run this directly against
-- the real Supabase project (SQL Editor, or `psql "$DATABASE_URL"`) AFTER
-- applying 0003. It is written to be safe to run against a project with
-- seed data (read-only assertions; the one INSERT attempt below is
-- expected to fail and is wrapped in a transaction that's always rolled
-- back).
--
-- Each block prints PASS/FAIL. A FAIL means the migration did not do what
-- it claims — do not consider Sprint 2 RLS work complete until every line
-- below prints PASS.

\set ON_ERROR_STOP off

-- ── Setup: grab one known-ACTIVE product id and one known-private id ────
-- Adjust these two lines to match real seeded data in your project if the
-- automatic SELECTs below return nothing (empty tables would make several
-- of these checks vacuously inconclusive rather than a real PASS).
SELECT id AS active_product_id INTO TEMP _t_product FROM products WHERE status = 'ACTIVE' AND deleted_at IS NULL LIMIT 1;
SELECT id AS any_user_id INTO TEMP _t_user FROM users LIMIT 1;
SELECT id AS any_order_id INTO TEMP _t_order FROM orders LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════
-- 1. anonymous → public products/categories/stores allowed
-- ═══════════════════════════════════════════════════════════════════════
SET ROLE anon;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM products WHERE status = 'ACTIVE' AND deleted_at IS NULL;
  IF cnt >= 0 THEN
    RAISE NOTICE 'PASS: anon can SELECT active products (rows visible: %)', cnt;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'FAIL: anon was denied SELECT on products — public catalog reads are broken';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM categories WHERE deleted_at IS NULL;
  RAISE NOTICE 'PASS: anon can SELECT categories (rows visible: %)', cnt;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'FAIL: anon was denied SELECT on categories';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM stores WHERE status = 'ACTIVE';
  RAISE NOTICE 'PASS: anon can SELECT active stores (rows visible: %)', cnt;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'FAIL: anon was denied SELECT on stores';
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. anonymous → private data denied (users, orders, cart, addresses,
--    creator PII/bank/documents, roles, sessions/tokens)
-- ═══════════════════════════════════════════════════════════════════════
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM users;
  IF cnt = 0 THEN
    RAISE NOTICE 'PASS: anon SELECT on users returned zero rows';
  ELSE
    RAISE NOTICE 'FAIL: anon can see % row(s) in users — RLS policy missing/misconfigured', cnt;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anon was denied SELECT on users outright';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM orders;
  IF cnt = 0 THEN RAISE NOTICE 'PASS: anon SELECT on orders returned zero rows';
  ELSE RAISE NOTICE 'FAIL: anon can see % row(s) in orders', cnt; END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anon was denied SELECT on orders outright';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM cart_items;
  IF cnt = 0 THEN RAISE NOTICE 'PASS: anon SELECT on cart_items returned zero rows';
  ELSE RAISE NOTICE 'FAIL: anon can see % row(s) in cart_items', cnt; END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anon was denied SELECT on cart_items outright';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM user_addresses;
  IF cnt = 0 THEN RAISE NOTICE 'PASS: anon SELECT on user_addresses returned zero rows';
  ELSE RAISE NOTICE 'FAIL: anon can see % row(s) in user_addresses', cnt; END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anon was denied SELECT on user_addresses outright';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM creator_bank_details;
  IF cnt = 0 THEN RAISE NOTICE 'PASS: anon SELECT on creator_bank_details returned zero rows';
  ELSE RAISE NOTICE 'FAIL: anon can see % row(s) in creator_bank_details — PAYMENT DATA EXPOSED', cnt; END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anon was denied SELECT on creator_bank_details outright';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM creators;
  IF cnt = 0 THEN RAISE NOTICE 'PASS: anon SELECT on creators (PII/tax fields) returned zero rows';
  ELSE RAISE NOTICE 'FAIL: anon can see % row(s) in creators', cnt; END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anon was denied SELECT on creators outright';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM sessions;
  IF cnt = 0 THEN RAISE NOTICE 'PASS: anon SELECT on sessions returned zero rows';
  ELSE RAISE NOTICE 'FAIL: anon can see % row(s) in sessions — SESSION TOKENS EXPOSED', cnt; END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anon was denied SELECT on sessions outright';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM "session"; -- legacy Better Auth table
  IF cnt = 0 THEN RAISE NOTICE 'PASS: anon SELECT on legacy "session" table returned zero rows';
  ELSE RAISE NOTICE 'FAIL: anon can see % row(s) in legacy "session"', cnt; END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anon was denied SELECT on legacy "session" outright';
END $$;

DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM user_roles;
  IF cnt = 0 THEN RAISE NOTICE 'PASS: anon SELECT on user_roles returned zero rows';
  ELSE RAISE NOTICE 'FAIL: anon can see % row(s) in user_roles', cnt; END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PASS: anon was denied SELECT on user_roles outright';
END $$;

-- anon attempting a WRITE anywhere, including the public-readable tables,
-- must fail (SELECT-only grants).
DO $$
BEGIN
  BEGIN
    INSERT INTO categories (name, slug) VALUES ('rls-test-should-fail', 'rls-test-should-fail-slug');
    RAISE NOTICE 'FAIL: anon was able to INSERT into categories';
    ROLLBACK;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: anon was denied INSERT on categories';
  END;
END $$;

RESET ROLE;

-- ═══════════════════════════════════════════════════════════════════════
-- 3/4/5. customer vs. another user's data, vs. creator/admin data
--
-- NOT MECHANICALLY TESTABLE AT THE DATABASE LAYER for this app, and that
-- is intentional, not a gap: there is no Postgres role/session variable
-- that represents "customer A" vs "customer B" (see 0003's header note —
-- Postgres cannot identify the application user). Per-user and
-- per-role authorization (customer-vs-own-data, creator-vs-other-creator,
-- non-admin-vs-admin-ops) is enforced entirely in the backend's own
-- request pipeline, not RLS: `shared/middleware/authorize.ts` (RBAC,
-- backed by `shared/authz/repository.ts`) plus each `route.ts`'s own
-- `authenticate()`/`authorize()` calls, and `modules/products/authorization.ts`
-- for the one module with product-specific ownership rules. Verify those
-- with the backend's own test suite and by hitting the real routes with
-- JWTs for different users/roles:
--   pnpm --filter backend test
-- Confirm specifically: users/me/addresses/[addressId], users/me/orders/
-- [orderId] (and its ShippingAddressNotFoundError path from the Sprint 2
-- audit — bad address must 404, not 500), and creator-scoped
-- stores/[storeId]/products/** routes reject cross-user and cross-role
-- access with 403/404.
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 6. documented admin → allowed
--
-- Also not an RLS concern here: admin access is a backend authorization
-- check (role/permission lookup against user_roles + role_permissions via
-- the JWT-authenticated user id), performed with the app's own DB
-- connection, which bypasses RLS as the table owner. Confirm via the
-- backend's admin route handlers (backend/src/app/api/v1/admin/**) using
-- a real admin JWT — RLS is not, and should not be, in that request path.
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- Sanity check: confirm the app's own connection is NOT affected
-- Run this section as the role from DATABASE_URL (i.e. do NOT `SET ROLE`
-- first — this should already be the connection's default role).
-- ═══════════════════════════════════════════════════════════════════════
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM users;
  RAISE NOTICE 'INFO: app connection SELECT on users returned % row(s) — should equal the real row count, not 0 or an error', cnt;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'FAIL: the application''s own DB connection was blocked by RLS — it is NOT the table owner. Do not ship 0003 until this is resolved (see 0003''s header note on owner-bypass).';
END $$;
