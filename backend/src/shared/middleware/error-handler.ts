import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { isKnownError, ValidationError } from '@/shared/errors/base-errors';
import { createModuleLogger } from '@/shared/observability/logger';

const logger = createModuleLogger('error-handler');

/**
 * Terminal error-handling middleware — 10-backend-architecture.md Section
 * 18.2–18.3. Every Route Handler's body runs inside
 * `shared/middleware/compose.ts`'s wrapper, which funnels any thrown error
 * here. This is the single place that:
 *   1. Maps a known {@link BaseError} subclass to its HTTP status + code.
 *   2. Maps an un-caught Zod validation failure the same way (so a
 *      Service Layer function that lets a Zod error propagate still
 *      produces a spec-compliant response, not a 500).
 *   3. Logs and returns a generic `INTERNAL_ERROR` for anything else,
 *      never leaking a stack trace or raw exception message to the client.
 */
export function handleRouteError(error: unknown, correlationId: string): NextResponse {
  if (isKnownError(error)) {
    if (error.httpStatus >= 500) {
      logger.error('Request failed with a known 5xx-class error', error, { correlationId });
    }
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
          correlationId,
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.httpStatus, headers: { 'X-Correlation-Id': correlationId } },
    );
  }

  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      'The request could not be processed because of a validation error.',
      error.issues.map((issue) => ({ field: issue.path.join('.'), issue: issue.message })),
    );
    return handleRouteError(validationError, correlationId);
  }

  logger.error('Unhandled error in Route Handler', error, { correlationId });

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        correlationId,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500, headers: { 'X-Correlation-Id': correlationId } },
  );
}
