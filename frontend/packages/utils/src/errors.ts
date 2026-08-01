/**
 * Generic error classes for client-side/business-rule failures raised
 * *within* UI code (e.g. a file exceeding the upload size limit before any
 * request is made). Distinct from `@dbk/api-client`'s `ApiError`, which
 * specifically wraps a server response's error envelope (09-api-architecture.md
 * §2.15) — these two intentionally never import from each other so a
 * feature can catch "did the server reject this" and "did our own
 * pre-flight validation reject this" as separate concerns.
 */
export class AppError extends Error {
  readonly code: string;

  constructor(message: string, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

/** Thrown by client-side validation that runs before a request is ever
 * made (e.g. ImageUploader rejecting an oversized file). Pair with
 * `error.message` directly — unlike `ApiError`, there's no server-side
 * error code to look up in `errorMessages.ts`, since nothing was sent. */
export class ValidationError extends AppError {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.field = field;
  }
}

/** A referenced local resource wasn't found — e.g. looking up a cached
 * item by id in a client-side store. Not for "the API returned 404" (use
 * `ApiError` with code `NOT_FOUND` for that). */
export class NotFoundError extends AppError {
  constructor(message = "The requested item could not be found.") {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}
