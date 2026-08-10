import "server-only";
import type { CreateReviewPayload, ReviewRecord, UpdateReviewPayload } from "@dbk/types";
import { apiFetch } from "../client";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

/** Public — no auth required to read a Product's reviews. */
export async function fetchProductReviews(
  productIdOrSlug: string,
  params: { limit?: number; offset?: number } = {},
): Promise<{ data: ReviewRecord[] }> {
  const search = new URLSearchParams();
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString();

  return apiFetch<{ data: ReviewRecord[] }>(
    `/products/${productIdOrSlug}/reviews${query ? `?${query}` : ""}`,
    { method: "GET", cache: "no-store" },
  );
}

export async function createReview(
  accessToken: string,
  productIdOrSlug: string,
  input: CreateReviewPayload,
): Promise<ReviewRecord> {
  return apiFetch<ReviewRecord>(`/products/${productIdOrSlug}/reviews`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function updateReview(
  accessToken: string,
  reviewId: string,
  input: UpdateReviewPayload,
): Promise<ReviewRecord> {
  return apiFetch<ReviewRecord>(`/reviews/${reviewId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: input,
  });
}

export async function deleteReview(accessToken: string, reviewId: string): Promise<void> {
  await apiFetch<void>(`/reviews/${reviewId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}
