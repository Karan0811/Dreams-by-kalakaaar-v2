import type { ApiErrorEnvelope } from "@dbk/types";
import { ApiError } from "./errors";

export interface BrowserRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Used exclusively by Client Components (via TanStack Query hooks) to call
 * this *same app's* Route Handlers under `/api` — never the upstream REST
 * API directly (11-frontend-architecture.md §10.1). Same origin, so no base
 * URL is needed; the Route Handler itself is the only thing that ever calls
 * `apiFetch`/holds the upstream Bearer token.
 */
export async function browserFetch<T>(path: string, options: BrowserRequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin",
  });

  if (!response.ok) {
    let envelope: ApiErrorEnvelope["error"];
    try {
      const parsed = (await response.json()) as ApiErrorEnvelope;
      envelope = parsed.error;
    } catch {
      envelope = {
        code: "NETWORK_ERROR",
        message: response.statusText || "Request failed",
        correlationId: crypto.randomUUID(),
      };
    }
    throw new ApiError(response.status, envelope);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
