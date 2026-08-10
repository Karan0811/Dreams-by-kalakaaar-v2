"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateProductVariantPayload,
  ProductVariantRecord,
  UpdateProductVariantPayload,
  VariantInventory,
} from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { productVariantKeys, creatorProductKeys } from "../query-keys";

export function useProductVariants(storeId: string, productId: string) {
  return useQuery({
    queryKey: productVariantKeys.list(productId),
    queryFn: () =>
      browserFetch<{ data: ProductVariantRecord[] }>(
        `/api/products/${productId}/variants?storeId=${encodeURIComponent(storeId)}`,
      ).then((r) => r.data),
    enabled: Boolean(productId && storeId),
  });
}

export function useCreateProductVariant(storeId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductVariantPayload) =>
      browserFetch<ProductVariantRecord>(`/api/products/${productId}/variants`, {
        method: "POST",
        body: { storeId, ...input },
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productVariantKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: creatorProductKeys.detail(productId) });
    },
  });
}

export function useUpdateProductVariant(storeId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, ...input }: UpdateProductVariantPayload & { variantId: string }) =>
      browserFetch<ProductVariantRecord>(`/api/products/${productId}/variants/${variantId}`, {
        method: "PATCH",
        body: { storeId, ...input },
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productVariantKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: creatorProductKeys.detail(productId) });
    },
  });
}

export function useArchiveProductVariant(storeId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) =>
      browserFetch<ProductVariantRecord>(
        `/api/products/${productId}/variants/${variantId}?storeId=${encodeURIComponent(storeId)}`,
        { method: "DELETE" },
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productVariantKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: creatorProductKeys.detail(productId) });
    },
  });
}

export function useVariantInventory(storeId: string, productId: string, variantId: string) {
  return useQuery({
    queryKey: productVariantKeys.inventory(variantId),
    queryFn: () =>
      browserFetch<VariantInventory>(
        `/api/products/${productId}/variants/${variantId}/inventory?storeId=${encodeURIComponent(storeId)}`,
      ),
    enabled: Boolean(storeId && productId && variantId),
  });
}
