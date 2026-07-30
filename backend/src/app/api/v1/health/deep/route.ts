import { sql } from 'drizzle-orm';
import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { jsonResource } from '@/shared/http/response';
import { db } from '@/shared/db/client';
import { redis } from '@/shared/redis/client';

/**
 * Deep health check — 18-observability-monitoring.md Section 8: exercises
 * every external dependency with real round-trip timing, restricted to
 * operators (`platform:health:read`) since it's more expensive to run and
 * discloses infrastructure detail that shouldn't be public.
 */
export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const authContext = await authenticate(request);
  await authorize(authContext.userId, 'platform:health:read');

  const results: Record<string, { status: 'ok' | 'error'; latencyMs: number }> = {};

  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    results.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch {
    results.database = { status: 'error', latencyMs: Date.now() - dbStart };
  }

  const redisStart = Date.now();
  try {
    await redis.ping();
    results.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
  } catch {
    results.redis = { status: 'error', latencyMs: Date.now() - redisStart };
  }

  return jsonResource(
    { status: 'ok', dependencies: results, timestamp: new Date().toISOString() },
    { correlationId },
  );
});
