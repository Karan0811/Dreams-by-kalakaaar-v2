"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateUserAddressPayload, UpdateUserAddressPayload, UserAddress } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { addressKeys } from "../query-keys";

export function useMyAddresses() {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: () => browserFetch<{ data: UserAddress[] }>("/api/addresses").then((r) => r.data),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserAddressPayload) =>
      browserFetch<UserAddress>("/api/addresses", { method: "POST", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: addressKeys.list() }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, ...input }: UpdateUserAddressPayload & { addressId: string }) =>
      browserFetch<UserAddress>(`/api/addresses/${addressId}`, { method: "PATCH", body: input }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: addressKeys.list() }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) =>
      browserFetch<void>(`/api/addresses/${addressId}`, { method: "DELETE" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: addressKeys.list() }),
  });
}
