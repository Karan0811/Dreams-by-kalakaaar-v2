import { NextResponse } from 'next/server';
import { resolveCorrelationId } from './correlation-id';
import { handleRouteError } from './error-handler';
import { createModuleLogger } from '@/shared/observability/logger';

const logger = createModuleLogger('http');

/**
 * Route handler composition — 10-backend-architecture.md Section 6.1's full
 * pipeline (Correlation ID → Logging → Rate Limit → Auth → Authorize →
 * Validate → Handler → Error Handler), collapsed into one wrapper so every
 * `route.ts` file is just:
 *
 * ```ts
 * export const POST = withRouteHandler(async ({ request, correlationId }) => {
 *   // ...
 * });
 * ```
 *
 * rather than re-implementing correlation-ID assignment, structured
 * request-start/request-end logging, and the terminal error mapping in
 * every single file. Rate limiting, authentication, and authorization are
 * deliberately NOT baked into this wrapper — they're explicit calls inside
 * each handler body (`enforceRateLimit`, `authenticate`, `authorize`),
 * because which tier/permission applies is route-specific, and an implicit
 * global default here would be easy to silently get wrong for a new route.
 */
export interface RouteHandlerContext {
  request: Request;
  correlationId: string;
  requestId: string;
  params: Record<string, string>;
}

type RouteHandler = (
  context: RouteHandlerContext,
) => Promise<NextResponse> | NextResponse;

export function withRouteHandler(handler: RouteHandler) {
  return async (
    request: Request,
    routeContext?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const { correlationId, requestId } = resolveCorrelationId(request);
    const startedAt = Date.now();
    const params = routeContext?.params ? await routeContext.params : {};

    logger.info('request.start', {
      correlationId,
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
    });

    try {
      const response = await handler({ request, correlationId, requestId, params });
      response.headers.set('X-Request-Id', requestId);
      logger.info('request.end', {
        correlationId,
        requestId,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return response;
    } catch (error) {
      const response = handleRouteError(error, correlationId);
      response.headers.set('X-Request-Id', requestId);
      logger.info('request.end', {
        correlationId,
        requestId,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return response;
    }
  };
}
