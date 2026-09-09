-- Order history is always scoped to one buyer and sorted newest-first.
-- The existing single-column indexes help independently, but this composite
-- index lets Postgres satisfy the common filter + ordering together.
CREATE INDEX IF NOT EXISTS "orders_user_created_at_idx"
  ON "orders" ("user_id", "created_at" DESC);