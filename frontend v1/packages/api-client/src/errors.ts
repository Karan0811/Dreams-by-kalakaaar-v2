import type { ApiErrorEnvelope } from "@dbk/types";

/**
 * Normalized client-side error shape, safe to import from both server-only
 * (`client.ts`) and client-safe (`browserFetch.ts`) modules. Kept in its own
 * file specifically so neither of those two ever needs to import from the
 * other — see the comments on `client.ts` for why that boundary matters.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly details?: Record<string, string[]>;
  readonly correlationId: string;
  readonly status: number;

  constructor(status: number, envelope: ApiErrorEnvelope["error"]) {
    super(envelope.message);
    this.name = "ApiError";
    this.status = status;
    this.code = envelope.code;
    this.details = envelope.details;
    this.correlationId = envelope.correlationId;
  }
}
