"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CancelOrderPayload, CreateOrderPayload, OrderDetail, OrderRecord } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { cartKeys, orderKeys } from "../query-keys";

export function useMyOrders(params: { status?: string; limit?: number; offset?: number } = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString();

  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () =>
      browserFetch<{ data: OrderRecord[] }>(`/api/orders${query ? `?${query}` : ""}`).then((r) => r.data),
  });
}

export function useMyOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => browserFetch<OrderDetail>(`/api/orders/${orderId}`),
    enabled: Boolean(orderId),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderPayload) =>
      browserFetch<OrderRecord>("/api/orders", { method: "POST", body: input }),
    onSuccess: () => {
      // A successful checkout clears the server-side cart, so both caches
      // need to reflect that immediately.
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...input }: CancelOrderPayload & { orderId: string }) =>
      browserFetch<OrderRecord>(`/api/orders/${orderId}/cancel`, { method: "POST", body: input }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}
