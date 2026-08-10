"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateReviewPayload, ReviewRecord, UpdateReviewPayload } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { reviewKeys } from "../query-keys";

export function useProductReviews(productIdOrSlug: string) {
  return useQuery({
    queryKey: reviewKeys.list(productIdOrSlug),
    queryFn: () =>
      browserFetch<{ data: ReviewRecord[] }>(`/api/products/${productIdOrSlug}/reviews`).then((r) => r.data),
    enabled: Boolean(productIdOrSlug),
  });
}

export function useCreateReview(productIdOrSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewPayload) =>
      browserFetch<ReviewRecord>(`/api/products/${productIdOrSlug}/reviews`, { method: "POST", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reviewKeys.list(productIdOrSlug) }),
  });
}

export function useUpdateReview(productIdOrSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, ...input }: UpdateReviewPayload & { reviewId: string }) =>
      browserFetch<ReviewRecord>(`/api/reviews/${reviewId}`, { method: "PATCH", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reviewKeys.list(productIdOrSlug) }),
  });
}

export function useDeleteReview(productIdOrSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => browserFetch<void>(`/api/reviews/${reviewId}`, { method: "DELETE" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reviewKeys.list(productIdOrSlug) }),
  });
}
