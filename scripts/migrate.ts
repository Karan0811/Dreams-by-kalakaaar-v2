/**
 * Thin wrapper — see `scripts/seed.ts`'s doc comment for why the actual
 * logic lives at `backend/src/scripts/migrate.ts` instead of here.
 *
 * Usage: `npm run db:migrate` (see backend/package.json).
 */
import '../backend/src/scripts/migrate';
