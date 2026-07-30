import { NextResponse } from 'next/server';
import type { PaginationEnvelope } from '@/shared/validation/common-schemas';

/**
 * Response envelope builders — 09-api-architecture.md Sections 2.15–2.16.
 *
 * Single-resource responses return the resource at the root (not wrapped).
 * Collection responses wrap the array under `data` with a `pagination`
 * sibling. Every response also carries rate-limit headers (Section 2.20)
 * and `X-Correlation-Id` (Section 2.18), set once here so no individual
 * Route Handler can forget them.
 */

export interface ResponseHeadersContext {
  correlationId: string;
  rateLimit?: { limit: number; remaining: number; reset: number };
}

function buildHeaders(context: ResponseHeadersContext): HeadersInit {
  const headers: Record<string, string> = {
    'X-Correlation-Id': context.correlationId,
  };

  if (context.rateLimit) {
    headers['X-RateLimit-Limit'] = String(context.rateLimit.limit);
    headers['X-RateLimit-Remaining'] = String(context.rateLimit.remaining);
    headers['X-RateLimit-Reset'] = String(Math.floor(context.rateLimit.reset / 1000));
  }

  return headers;
}

export function jsonResource<T>(
  resource: T,
  context: ResponseHeadersContext,
  status = 200,
): NextResponse {
  return NextResponse.json(resource as object, { status, headers: buildHeaders(context) });
}

export function jsonCollection<T>(
  envelope: PaginationEnvelope<T>,
  context: ResponseHeadersContext,
  status = 200,
): NextResponse {
  return NextResponse.json(envelope, { status, headers: buildHeaders(context) });
}

export function jsonNoContent(context: ResponseHeadersContext): NextResponse {
  return new NextResponse(null, { status: 204, headers: buildHeaders(context) });
}
