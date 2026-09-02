-- Catalog read-path indexes.
--
-- The public catalog always filters to ACTIVE, non-deleted rows and orders by
-- created_at for its default cursor. A partial index matches that predicate
-- instead of making Postgres scan the entire products table.
CREATE INDEX IF NOT EXISTS "products_public_created_cursor_idx"
  ON "products" ("created_at" DESC, "id" DESC)
  WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "products_public_category_cursor_idx"
  ON "products" ("primary_category_id", "created_at" DESC, "id" DESC)
  WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL;

-- Price filters/sorts use MIN(product_variants.price_amount) per product.
-- The existing product_id index helps the join, while this covering index
-- lets PostgreSQL satisfy the aggregate from the index pages.
CREATE INDEX IF NOT EXISTS "product_variants_product_price_idx"
  ON "product_variants" ("product_id", "price_amount");

-- Keep the media batch enrichment ordered by its join/filter columns.
CREATE INDEX IF NOT EXISTS "product_media_product_primary_order_idx"
  ON "product_media" ("product_id", "is_primary" DESC, "display_order");

-- Product search uses contains matching (`%term%`), which a btree index
-- cannot accelerate. Supabase/PostgreSQL provides pg_trgm for this workload.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "products_title_trgm_idx"
  ON "products" USING gin ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_description_trgm_idx"
  ON "products" USING gin ("description" gin_trgm_ops);