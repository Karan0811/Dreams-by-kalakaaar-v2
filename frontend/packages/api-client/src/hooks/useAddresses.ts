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
    onSuccess: (address) => {
      queryClient.setQueryData<UserAddress[]>(addressKeys.list(), (current) =>
        current ? [...current, address] : current,
      );
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, ...input }: UpdateUserAddressPayload & { addressId: string }) =>
      browserFetch<UserAddress>(`/api/addresses/${addressId}`, { method: "PATCH", body: input }),
    onSuccess: (address) => {
      queryClient.setQueryData<UserAddress[]>(addressKeys.list(), (current) =>
        current?.map((item) => (item.id === address.id ? address : item)),
      );
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) =>
      browserFetch<void>(`/api/addresses/${addressId}`, { method: "DELETE" }),
    onSuccess: (_, addressId) => {
      queryClient.setQueryData<UserAddress[]>(addressKeys.list(), (current) =>
        current?.filter((item) => item.id !== addressId),
      );
    },
  });
}
