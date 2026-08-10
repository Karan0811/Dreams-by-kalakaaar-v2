"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AddCartItemPayload, CartEntry, CartState, UpdateCartItemPayload } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { cartKeys } from "../query-keys";

/**
 * Cart contents are always server state — never duplicated into a Zustand
 * store. `staleTime: 0`: cart must never show stale state. Real backend
 * shape (`CartState`) — see `cart.server.ts`'s doc comment for why this
 * replaced the Sprint 01 aspirational `Cart` type.
 */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: () => browserFetch<CartState>("/api/cart"),
    staleTime: 0,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddCartItemPayload) =>
      browserFetch<CartEntry>("/api/cart/items", { method: "POST", body: input }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, ...input }: UpdateCartItemPayload & { cartItemId: string }) =>
      browserFetch<CartEntry>(`/api/cart/items/${cartItemId}`, { method: "PATCH", body: input }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: string) =>
      browserFetch<void>(`/api/cart/items/${cartItemId}`, { method: "DELETE" }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    },
  });
}
