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
    onSuccess: (entry) => {
      queryClient.setQueryData<WishlistEntry[]>(wishlistKeys.list(), (current) => {
        if (!current || current.some((item) => item.id === entry.id)) return current;
        return [entry, ...current];
      });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      browserFetch<void>(`/api/wishlist/${productId}`, { method: "DELETE" }),
    onSuccess: (_, productId) => {
      queryClient.setQueryData<WishlistEntry[]>(wishlistKeys.list(), (current) =>
        current?.filter((item) => item.productId !== productId),
      );
    },
  });
}
