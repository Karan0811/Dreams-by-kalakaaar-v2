import { nanoid } from 'nanoid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Correlation ID assignment — 10-backend-architecture.md Section 6.1 (first
 * pipeline step) and Section 19.5. Uses the client-supplied
 * `X-Correlation-Id` if present (so a single logical operation spanning
 * multiple requests can share one ID), otherwise generates one.
 *
 * `X-Request-Id` is always server-generated and unique per request/response
 * pair, distinct from the potentially-shared Correlation ID
 * (09-api-architecture.md Section 2.4.2).
 */
export function resolveCorrelationId(request: Request): { correlationId: string; requestId: string } {
  const supplied = request.headers.get(CORRELATION_ID_HEADER);
  const correlationId = supplied && isValidId(supplied) ? supplied : nanoid();
  const requestId = nanoid();
  return { correlationId, requestId };
}

function isValidId(value: string): boolean {
  return value.length > 0 && value.length <= 128;
}
