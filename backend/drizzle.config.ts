import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

/**
 * drizzle-kit configuration.
 *
 * Migration files are emitted to `../database/migrations` rather than a
 * `backend`-local folder: this repository's top-level `database/` directory
 * is the designated home for schema/migration/seed artifacts (see the
 * project root layout), while `backend/` holds the application code that
 * defines the schema those migrations implement
 * (10-backend-architecture.md Section 4.1's `shared/db/schema`).
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/db/schema/index.ts',
  out: '../database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/dreams_by_kalakaaar',
  },
  verbose: true,
  strict: true,
});
