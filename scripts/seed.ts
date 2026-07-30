/**
 * Thin wrapper — the actual seeding logic lives at
 * `backend/src/scripts/seed.ts` so its imports (drizzle-orm, the schema,
 * etc.) resolve against `backend/node_modules` the normal way Node
 * resolves modules (walking up from the *importing file's* location, not
 * from the process's current working directory).
 *
 * This file exists so `scripts/` — the folder this repository designates
 * for seed/migration/setup scripts — has a `seed.ts` a person can find and
 * run directly, without needing to know that detail.
 *
 * Usage: `npm run db:seed` (see backend/package.json), which invokes this
 * file with `backend/` as the working directory.
 */
import '../backend/src/scripts/seed';
