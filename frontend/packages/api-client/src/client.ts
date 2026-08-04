import "server-only";
import type { ApiErrorEnvelope } from "@dbk/types";
import { ApiError } from "./errors";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Attached to mutating requests per 09-api-architecture.md's idempotency
   * contract; only idempotent requests are safe to auto-retry (§10.7). */
  idempotencyKey?: string;
  /** Next.js's fetch cache extension. Typed explicitly here (rather than via
   * casts to `RequestInit` at each call site) since this package has no
   * Next.js app's ambient type augmentation of the global `fetch`/`RequestInit`
   * types to fall back on. */
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

/**
 * The single point where every app-internal Route Handler talks to the
 * upstream REST API (09-api-architecture.md). Browsers never call this
 * directly — only Next.js Route Handlers / Server Actions import it,
 * preserving the BFF boundary from 11-frontend-architecture.md §10.1.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured.");
  }

  const correlationId = crypto.randomUUID();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Correlation-Id", correlationId);
  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let envelope: ApiErrorEnvelope["error"];
    try {
      const parsed = (await response.json()) as ApiErrorEnvelope;
      envelope = parsed.error;
    } catch {
      envelope = {
        code: response.status >= 500 ? "SERVER_ERROR" : "DEFAULT",
        message: response.statusText || "Request failed",
        correlationId,
      };
    }
    throw new ApiError(response.status, envelope);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
