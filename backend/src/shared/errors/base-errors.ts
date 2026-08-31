/**
 * Shared error taxonomy — 10-backend-architecture.md Section 18.2.
 *
 * Every intentionally-thrown error in the backend is an instance of one of
 * these classes. The terminal error-handling middleware
 * (`shared/middleware/error-handler.ts`) performs an exhaustive `instanceof`
 * check against this taxonomy to build 09-api-architecture.md Section 2.15's
 * response envelope — the error class *is* the HTTP mapping, by construction.
 *
 * Modules extend these base classes with module-specific subclasses (e.g.
 * `modules/products/errors.ts`'s `ProductNotPublishReadyError extends
 * ValidationError`) rather than throwing a base class directly, so that a
 * stable, catalog-matching `code` is always attached.
 */

export interface ErrorDetail {
  field?: string;
  issue: string;
}

export abstract class BaseError extends Error {
  /** Stable, machine-readable, SCREAMING_SNAKE_CASE code (09-api-architecture.md Section 2.15). */
  abstract readonly code: string;
  /** HTTP status this error class maps to. */
  abstract readonly httpStatus: number;
  /** Field-level detail, present only for validation-class errors. */
  readonly details?: ErrorDetail[];

  constructor(message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** 400/422 — Zod parse failures and business-rule violations. */
export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus: number;

  constructor(message: string, details?: ErrorDetail[], httpStatus: 400 | 422 = 422) {
    super(message, details);
    this.httpStatus = httpStatus;
  }
}

/** 401 — missing/invalid/expired credentials. */
export class AuthenticationError extends BaseError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly httpStatus = 401;
}

/** 403 — RBAC/ownership failures. */
export class AuthorizationError extends BaseError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly httpStatus = 403;
}

/** 404 — resource does not exist, or caller is not authorized to know it exists. */
export class NotFoundError extends BaseError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;
}

/** 409 — idempotency-key mismatch, duplicate resource, business-state conflict. */
export class ConflictError extends BaseError {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;
}

/** 402 — payment-specific failures. */
export class PaymentError extends BaseError {
  readonly code: string = 'PAYMENT_ERROR';
  readonly httpStatus = 402;
}

/** 429 — thrown by the rate-limit middleware. */
export class RateLimitError extends BaseError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly httpStatus = 429;
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** 503 — a wrapped, classified failure from an external-service client. */
export class IntegrationError extends BaseError {
  readonly code = 'INTEGRATION_ERROR';
  readonly httpStatus = 503;
}

export function isKnownError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}
