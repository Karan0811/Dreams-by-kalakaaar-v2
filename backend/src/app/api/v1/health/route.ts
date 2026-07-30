import { withRouteHandler } from '@/shared/middleware/compose';
import { jsonResource } from '@/shared/http/response';

/**
 * Liveness probe — 18-observability-monitoring.md Section 8: "is the
 * process up at all", with zero dependency checks so it can never report
 * unhealthy due to a downstream outage (which would cause the platform to
 * needlessly cycle a perfectly healthy instance).
 */
export const GET = withRouteHandler(async ({ correlationId }) => {
  return jsonResource({ status: 'ok', timestamp: new Date().toISOString() }, { correlationId });
});
