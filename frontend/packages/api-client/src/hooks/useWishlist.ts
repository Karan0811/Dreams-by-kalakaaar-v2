"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WishlistEntry } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { wishlistKeys } from "../query-keys";

export function useWishlist() {
  return useQuery({
    queryKey: wishlistKeys.list(),
    queryFn: () => browserFetch<{ data: WishlistEntry[] }>("/api/wishlist").then((r) => r.data),
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      browserFetch<WishlistEntry>("/api/wishlist", { method: "POST", body: { productId } }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: wishlistKeys.list() }),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      browserFetch<void>(`/api/wishlist/${productId}`, { method: "DELETE" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: wishlistKeys.list() }),
  });
}
