"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdjustInventoryPayload,
  AttachMediaPayload,
  CreateProductPayload,
  CreatorProduct,
  CreatorProductListParams,
  MediaUploadUrlResponse,
  PaginatedResponse,
  RequestMediaUploadPayload,
  UpdateProductPayload,
} from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { creatorProductKeys } from "../query-keys";

/**
 * Every hook here calls this app's own `/api/products/...` BFF routes
 * (never the upstream REST API directly — 11-frontend-architecture.md
 * §10.1's BFF boundary). `storeId` is passed explicitly by the caller
 * (resolved once, server-side, by the page — see
 * `apps/creator/app/(dashboard)/dashboard/products/page.tsx`) rather than
 * re-resolved per request.
 */

export function useCreatorProducts(storeId: string, params: CreatorProductListParams) {
  const search = new URLSearchParams({ storeId });
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.page !== undefined) search.set("page", String(params.page));

  return useQuery({
    queryKey: creatorProductKeys.list({ storeId, ...params }),
    queryFn: () =>
      browserFetch<PaginatedResponse<CreatorProduct>>(`/api/products?${search.toString()}`),
    enabled: Boolean(storeId),
  });
}

export function useCreatorProduct(storeId: string, productId: string) {
  return useQuery({
    queryKey: creatorProductKeys.detail(productId),
    queryFn: () =>
      browserFetch<{ data: CreatorProduct }>(
        `/api/products/${productId}?storeId=${encodeURIComponent(storeId)}`,
      ).then((r) => r.data),
    enabled: Boolean(storeId && productId),
  });
}

export function useCreateProduct(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      browserFetch<{ data: CreatorProduct }>("/api/products", {
        method: "POST",
        body: { storeId, ...payload },
      }).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.lists() });
    },
  });
}

export function useUpdateProduct(storeId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) =>
      browserFetch<{ data: CreatorProduct }>(`/api/products/${productId}`, {
        method: "PATCH",
        body: { storeId, ...payload },
      }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(creatorProductKeys.detail(productId), data);
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.lists() });
    },
  });
}

export function useTransitionProductStatus(storeId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: "ACTIVE" | "PAUSED" | "ARCHIVED") =>
      browserFetch<{ data: CreatorProduct }>(`/api/products/${productId}`, {
        method: "PATCH",
        body: { storeId, status },
      }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(creatorProductKeys.detail(productId), data);
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.lists() });
    },
  });
}

export function useDeleteProduct(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      browserFetch<void>(`/api/products/${productId}`, {
        method: "DELETE",
        body: { storeId },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.lists() });
    },
  });
}

/** Step 1+2 of the image upload flow, combined into one client-side call:
 * request a presigned URL, PUT the file directly to R2, then confirm/attach. */
export function useUploadProductImage(storeId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      altText,
      isPrimary,
    }: {
      file: File;
      altText: string;
      isPrimary?: boolean;
    }) => {
      const uploadRequest: RequestMediaUploadPayload = {
        fileName: file.name,
        contentType: file.type as RequestMediaUploadPayload["contentType"],
        sizeBytes: file.size,
      };

      const { uploadUrl, mediaId } = await browserFetch<{ data: MediaUploadUrlResponse }>(
        `/api/products/${productId}/media/upload-url`,
        { method: "POST", body: { storeId, ...uploadRequest } },
      ).then((r) => r.data);

      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResponse.ok) {
        throw new Error("Image upload to storage failed.");
      }

      const attachPayload: AttachMediaPayload = { mediaId, altText, isPrimary };
      await browserFetch<void>(`/api/products/${productId}/media`, {
        method: "POST",
        body: { storeId, ...attachPayload },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.detail(productId) });
    },
  });
}

export function useDeleteProductMedia(storeId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productMediaId: string) =>
      browserFetch<void>(`/api/products/${productId}/media/${productMediaId}`, {
        method: "DELETE",
        body: { storeId },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.detail(productId) });
    },
  });
}

export function useAdjustInventory(storeId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, ...payload }: AdjustInventoryPayload & { variantId: string }) =>
      browserFetch<void>(`/api/products/${productId}/variants/${variantId}/inventory`, {
        method: "PATCH",
        body: { storeId, ...payload },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.detail(productId) });
    },
  });
}
