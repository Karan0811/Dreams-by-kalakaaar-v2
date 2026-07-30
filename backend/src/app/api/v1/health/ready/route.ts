import { sql } from 'drizzle-orm';
import { withRouteHandler } from '@/shared/middleware/compose';
import { jsonResource } from '@/shared/http/response';
import { db } from '@/shared/db/client';
import { redis } from '@/shared/redis/client';
import { IntegrationError } from '@/shared/errors/base-errors';

/**
 * Readiness probe — 18-observability-monitoring.md Section 8: "can this
 * instance actually serve traffic right now" — checks the two dependencies
 * every request effectively needs (Postgres, Redis for rate limiting).
 */
export const GET = withRouteHandler(async ({ correlationId }) => {
  const checks: Record<string, 'ok' | 'error'> = {};

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const allHealthy = Object.values(checks).every((status) => status === 'ok');

  if (!allHealthy) {
    throw new IntegrationError('One or more dependencies are not ready.');
  }

  return jsonResource({ status: 'ready', checks, timestamp: new Date().toISOString() }, { correlationId });
});
