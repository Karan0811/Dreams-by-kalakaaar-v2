"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@dbk/types";
import type { AddCartItemInput } from "@dbk/utils";
import { browserFetch } from "../browserFetch";
import { cartKeys } from "../query-keys";

/** Cart contents are always server state (§9.1) — never duplicated into a
 * Zustand store. `staleTime: 0` per §9.10: cart must never show stale state. */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: () => browserFetch<{ data: Cart }>("/api/cart").then((r) => r.data),
    staleTime: 0,
  });
}

/**
 * Add to Cart is a low-risk, reversible mutation, so it applies optimistic UI
 * per §10.3: the cache updates immediately in `onMutate`, with automatic
 * rollback in `onError`.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddCartItemInput) =>
      browserFetch<{ data: Cart }>("/api/cart/items", { method: "POST", body: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.current() });
      const previousCart = queryClient.getQueryData<Cart>(cartKeys.current());
      return { previousCart, input };
    },
    onError: (_err, _input, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.current(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}
