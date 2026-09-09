-- 0003_rls_defense_in_depth.sql
--
-- RLS + least-privilege grants for `anon` / `authenticated` — Supabase's
-- default PostgREST roles. Written by hand (not `drizzle-kit generate`),
-- since RLS/GRANT statements are not modeled in the Drizzle schema.
--
-- ── Why this migration exists ───────────────────────────────────────────
-- This application does NOT use Supabase Auth. Every request is
-- authenticated by the backend's own Better Auth + RS256 JWT bridge, and
-- both the backend and the frontend's Better Auth instance talk to
-- Postgres through one shared `DATABASE_URL` service credential — not a
-- per-end-user Postgres role, and not a Supabase-issued JWT that
-- PostgREST/`auth.uid()` could read. Postgres therefore has NO reliable
-- way to know "which end user" issued a given query. Per this migration's
-- brief: because Postgres cannot safely identify the application user,
-- this migration does NOT attempt `auth.uid()`-based per-user row
-- policies (that would either silently evaluate to NULL and deny
-- everything, or — worse — be spoofable). Per-user authorization stays
-- exactly where it already is: the backend's Service/Repository layers
-- (`shared/authz`, each module's `authorization.ts`).
--
-- What RLS *does* provide here is defense-in-depth against a different,
-- real risk: Supabase provisions a PostgREST auto-API (`/rest/v1/...`)
-- against the `public` schema by default, addressable with the project's
-- `anon`/`authenticated` keys — entirely independent of whether this
-- codebase's own application code ever calls it. A grep of the full
-- repository confirms neither the buyer/creator frontends nor the backend
-- currently construct a Supabase client or reference `SUPABASE_ANON_KEY`/
-- `SUPABASE_SERVICE_ROLE_KEY` anywhere — but the keys are already present
-- in `backend/.env.example` for future Storage/Realtime use, and nothing
-- in Postgres itself currently stops a request bearing the anon key from
-- reading or writing any row directly via PostgREST if grants/RLS are
-- left at Supabase's defaults. This migration closes that gap without
-- touching how the backend's own service credential talks to the
-- database.
--
-- ── How the backend's own connection is affected ────────────────────────
-- Every statement below uses `ENABLE ROW LEVEL SECURITY`, never `FORCE
-- ROW LEVEL SECURITY`. Table owners (and superusers) always bypass RLS
-- unless FORCE is also set — so as long as the role in `DATABASE_URL`
-- is the table owner (true for whatever role ran migrations 0000-0002)
-- or a superuser, this migration changes nothing about how the backend
-- or Better Auth read/write these tables. This is a documented assumption
-- this migration cannot verify from a static sandbox with no DB access —
-- confirm with `SELECT tableowner FROM pg_tables WHERE schemaname =
-- 'public'` against the real environment before relying on it in
-- production, and re-run the security test matrix in TESTING.md if the
-- app's own role ever changes to something other than the table owner.
--
-- ── Legacy Better Auth tables ────────────────────────────────────────────
-- `"user"`, `"session"`, `"account"`, `"verification"` are NOT altered,
-- renamed, or migrated here, per instruction. RLS is enabled on them
-- (again, non-FORCE, so Better Auth's own connection is unaffected) with
-- no permissive policies for anon/authenticated, matching every other
-- identity-adjacent table below.
--
-- ── service_role ─────────────────────────────────────────────────────────
-- Supabase's `service_role` bypasses RLS by design (it's the
-- server-side/admin key) and already holds broad grants at the project
-- level — nothing to configure here. If Storage/Realtime integration is
-- added later using `SUPABASE_SERVICE_ROLE_KEY`, it is unaffected by this
-- migration's `anon`/`authenticated` restrictions.

-- ── 1. Revoke Supabase's schema-level default privileges ────────────────
-- Supabase projects commonly set `ALTER DEFAULT PRIVILEGES ... GRANT ALL
-- ON TABLES TO anon, authenticated, service_role` at the `public` schema
-- level, meaning every new table (including everything Drizzle created in
-- 0000-0002) may already be broadly readable/writable by `anon`/
-- `authenticated` regardless of RLS state. Revoking first establishes a
-- known-clean deny-by-default baseline; the explicit GRANTs in section 3
-- then re-open only the narrow public-catalog reads this app intends.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
--> statement-breakpoint

-- ── 2. Enable RLS on every application table ─────────────────────────────
-- Non-FORCE everywhere (see note above) — this only affects roles that
-- are not the table owner, i.e. exactly the `anon`/`authenticated`
-- PostgREST roles this migration targets.

-- Identity (backend's own schema)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "authentication_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_resets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "devices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "better_auth_verifications" ENABLE ROW LEVEL SECURITY;

-- Legacy Better Auth tables (frontend's own schema) — not touched otherwise.
-- They are optional: this repository's current migrations use the plural
-- backend-owned tables above, so a clean install does not have these legacy
-- relations. Guard them instead of making the whole security migration fail.
DO $$
BEGIN
  IF to_regclass('public.user') IS NOT NULL THEN
    ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
  END IF;
  IF to_regclass('public.session') IS NOT NULL THEN
    ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
  END IF;
  IF to_regclass('public.account') IS NOT NULL THEN
    ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
  END IF;
  IF to_regclass('public.verification') IS NOT NULL THEN
    ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Authorization (roles/permissions)
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resource_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permission_audits" ENABLE ROW LEVEL SECURITY;

-- Marketplace / creator data (includes PII + payment-adjacent fields)
ALTER TABLE "creators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "store_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "creator_addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "creator_bank_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "creator_social_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "creator_documents" ENABLE ROW LEVEL SECURITY;

-- Stores — the public-facing storefront entity (public SELECT policy below)
ALTER TABLE "stores" ENABLE ROW LEVEL SECURITY;

-- Catalog (public SELECT policies below)
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;

-- Media — polymorphic (product images AND creator KYC documents share this
-- table); kept fully locked down rather than trying to split "public"
-- image rows from "private" document rows with a row policy that could be
-- gotten wrong. Product images are already served through `publicUrl`
-- (an R2/CDN URL) embedded in the backend's own product responses, not by
-- querying this table directly, so no public grant is needed here.
ALTER TABLE "media" ENABLE ROW LEVEL SECURITY;

-- Inventory — no public grant; buyer-facing availability is a derived
-- boolean the backend computes server-side (`enrichProductsForPublicResponse`),
-- not a raw quantity anon should ever read directly.
ALTER TABLE "inventory" ENABLE ROW LEVEL SECURITY;

-- Cart / Orders / Addresses / Wishlist / Notifications — always private
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_status_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wishlist_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- ── 3. Narrow public-catalog SELECT policies + grants ────────────────────
-- Only these six tables get any anon/authenticated access at all, and
-- only SELECT, and only rows that are already meant to be publicly
-- browsable storefront content — mirroring exactly what
-- `listPublicProducts`/`findPublicProductByIdOrSlug` already expose
-- through the backend today (`status = 'ACTIVE'`, not soft-deleted).
-- `authenticated` gets the identical policy to `anon` — being logged in
-- grants no *additional* row visibility here; write access for a signed-in
-- buyer/creator continues to go through the backend's own authorization
-- checks, never direct table writes.

-- Categories: no status/lifecycle gate other than soft-delete.
CREATE POLICY "public_read_categories" ON "categories"
  FOR SELECT
  TO anon, authenticated
  USING ("deleted_at" IS NULL);
GRANT SELECT ON "categories" TO anon, authenticated;
--> statement-breakpoint

-- Stores: only ACTIVE storefronts. (`creators` — the row with PII/tax
-- fields — deliberately has no policy or grant here.)
CREATE POLICY "public_read_active_stores" ON "stores"
  FOR SELECT
  TO anon, authenticated
  USING ("status" = 'ACTIVE');
GRANT SELECT ON "stores" TO anon, authenticated;
--> statement-breakpoint

-- Products: only ACTIVE, non-deleted listings — identical filter to
-- `findPublicProductByIdOrSlug`/`listPublicProducts` in
-- `backend/src/modules/products/repository.ts`.
CREATE POLICY "public_read_active_products" ON "products"
  FOR SELECT
  TO anon, authenticated
  USING ("status" = 'ACTIVE' AND "deleted_at" IS NULL);
GRANT SELECT ON "products" TO anon, authenticated;
--> statement-breakpoint

-- Product variants: only variants belonging to a publicly-visible product,
-- and only ACTIVE (not archived) variants.
CREATE POLICY "public_read_active_product_variants" ON "product_variants"
  FOR SELECT
  TO anon, authenticated
  USING (
    "status" = 'ACTIVE'
    AND EXISTS (
      SELECT 1 FROM "products"
      WHERE "products"."id" = "product_variants"."product_id"
        AND "products"."status" = 'ACTIVE'
        AND "products"."deleted_at" IS NULL
    )
  );
GRANT SELECT ON "product_variants" TO anon, authenticated;
--> statement-breakpoint

-- Product media: gallery rows for a publicly-visible product. (The
-- underlying `media` table itself stays locked down — see section 2's
-- note; a client resolves the image via the already-public `publicUrl`
-- column carried on this join row's row, not by querying `media` itself.)
CREATE POLICY "public_read_active_product_media" ON "product_media"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "products"
      WHERE "products"."id" = "product_media"."product_id"
        AND "products"."status" = 'ACTIVE'
        AND "products"."deleted_at" IS NULL
    )
  );
GRANT SELECT ON "product_media" TO anon, authenticated;
--> statement-breakpoint

-- Product ↔ category associations for publicly-visible products only.
CREATE POLICY "public_read_active_product_categories" ON "product_categories"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "products"
      WHERE "products"."id" = "product_categories"."product_id"
        AND "products"."status" = 'ACTIVE'
        AND "products"."deleted_at" IS NULL
    )
  );
GRANT SELECT ON "product_categories" TO anon, authenticated;
--> statement-breakpoint

-- Reviews: published product reviews are ordinary public storefront
-- content (ratings/body/title), scoped to a publicly-visible product.
-- No moderation/soft-delete column exists on `reviews` yet — if one is
-- added in a future sprint, this policy must be updated to also filter on
-- it (documented here so that future change doesn't silently reopen
-- unmoderated content). Write access (INSERT/UPDATE/DELETE) is
-- intentionally NOT granted — reviews are created only via the backend's
-- authenticated, purchase-aware Reviews module.
CREATE POLICY "public_read_reviews_for_active_products" ON "reviews"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "products"
      WHERE "products"."id" = "reviews"."product_id"
        AND "products"."status" = 'ACTIVE'
        AND "products"."deleted_at" IS NULL
    )
  );
GRANT SELECT ON "reviews" TO anon, authenticated;
--> statement-breakpoint

-- ── 4. Everything else: RLS enabled, zero policies, zero grants ─────────
-- No CREATE POLICY / GRANT statements follow for: users, user_profiles,
-- authentication_accounts, sessions, refresh_tokens, email_verifications,
-- password_resets, devices, better_auth_verifications, "user", "session",
-- "account", "verification", roles, permissions, role_permissions,
-- user_roles, resource_permissions, permission_audits, creators,
-- store_verifications, creator_addresses, creator_bank_details,
-- creator_social_links, creator_documents, media, inventory, cart_items,
-- orders, order_items, order_status_history, user_addresses,
-- wishlist_items, notifications. With RLS enabled and no permissive
-- policy, `anon`/`authenticated` get zero rows even if a future
-- misconfiguration re-adds a table-level GRANT — the deny is structural,
-- not just an absence of a grant. The backend's own (owner/superuser)
-- connection is unaffected, per the non-FORCE note in this file's header.
