"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AddCartItemPayload, CartEntry, CartState, UpdateCartItemPayload } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { cartKeys } from "../query-keys";

/**
 * Cart contents are always server state — never duplicated into a Zustand
 * store. Mutations reconcile the cache from their response, while the short
 * freshness window avoids redundant remount refetches. Real backend shape
 * (`CartState`) — see `cart.server.ts`'s doc comment for why this replaced
 * the Sprint 01 aspirational `Cart` type.
 */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: () => browserFetch<CartState>("/api/cart"),
    // Mutations update this cache directly below. A short freshness window
    // avoids refetching the same cart every time the persistent shop chrome
    // remounts while still reconciling naturally on a new visit.
    staleTime: 30_000,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddCartItemPayload) =>
      browserFetch<CartEntry>("/api/cart/items", { method: "POST", body: input }),
    onSuccess: (entry) => {
      queryClient.setQueryData<CartState>(cartKeys.current(), (current) => {
        if (!current) return current;
        const items = current.items.some((item) => item.id === entry.id)
          ? current.items.map((item) => (item.id === entry.id ? entry : item))
          : [...current.items, entry];
        return {
          ...current,
          items,
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          subtotalAmount: items.reduce(
            (sum, item) => sum + item.variant.priceAmount * item.quantity,
            0,
          ),
          currency: items[0]?.variant.priceCurrency ?? current.currency,
        };
      });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, ...input }: UpdateCartItemPayload & { cartItemId: string }) =>
      browserFetch<CartEntry>(`/api/cart/items/${cartItemId}`, { method: "PATCH", body: input }),
    onSuccess: (entry) => {
      queryClient.setQueryData<CartState>(cartKeys.current(), (current) => {
        if (!current) return current;
        const items = current.items.map((item) => (item.id === entry.id ? { ...item, ...entry } : item));
        return {
          ...current,
          items,
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          subtotalAmount: items.reduce(
            (sum, item) => sum + item.variant.priceAmount * item.quantity,
            0,
          ),
        };
      });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: string) =>
      browserFetch<void>(`/api/cart/items/${cartItemId}`, { method: "DELETE" }),
    onSuccess: (_, cartItemId) => {
      queryClient.setQueryData<CartState>(cartKeys.current(), (current) => {
        if (!current) return current;
        const items = current.items.filter((item) => item.id !== cartItemId);
        return {
          ...current,
          items,
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          subtotalAmount: items.reduce(
            (sum, item) => sum + item.variant.priceAmount * item.quantity,
            0,
          ),
          currency: items[0]?.variant.priceCurrency ?? current.currency,
        };
      });
    },
  });
}
