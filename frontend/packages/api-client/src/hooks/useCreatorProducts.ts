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

export function useUpdateProductMedia(storeId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productMediaId,
      ...payload
    }: {
      productMediaId: string;
      displayOrder?: number;
      isPrimary?: boolean;
      altText?: string;
    }) =>
      browserFetch<void>(`/api/products/${productId}/media/${productMediaId}`, {
        method: "PATCH",
        body: { storeId, ...payload },
      }),
    // Reordering feels sluggish waiting on a round-trip per drag; the
    // caller (ProductImageGallery) updates its own local order state
    // immediately and this mutation just persists it, so no optimistic
    // cache write is needed here.
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

/**
 * Duplicate Product — there is no dedicated backend endpoint for this (only
 * `POST /products` at creation time accepts variants), so this composes two
 * existing calls: fetch the source product's full detail (for its
 * variants), then create a new DRAFT product from that data with "(Copy)"
 * appended to the title. Deliberately does not copy photos — the backend
 * has no "duplicate media" endpoint either, and copying a creator's file
 * without a fresh presigned upload isn't something this API supports; the
 * new draft opens on the Edit page where photos can be re-added directly.
 */
export function useDuplicateProduct(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: CreatorProduct) => {
      const detail = await browserFetch<{ data: CreatorProduct }>(
        `/api/products/${product.id}?storeId=${encodeURIComponent(storeId)}`,
      ).then((r) => r.data);

      const payload: CreateProductPayload = {
        title: `${detail.title} (Copy)`,
        description: detail.description,
        productType: detail.productType,
        leadTimeDays: detail.leadTimeDays ?? undefined,
        primaryCategoryId: detail.primaryCategoryId ?? undefined,
        variants: (detail.variants ?? []).map((v) => ({
          attributes: v.attributes,
          priceAmount: v.priceAmount,
          priceCurrency: v.priceCurrency,
          skuReference: undefined, // SKUs should stay unique per listing, not be copied verbatim
          initialQuantity: 0, // a duplicate starts with no stock until the creator sets it
        })),
      };

      return browserFetch<{ data: CreatorProduct }>("/api/products", {
        method: "POST",
        body: { storeId, ...payload },
      }).then((r) => r.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.lists() });
    },
  });
}

/**
 * Bulk Actions — the backend has no bulk endpoints, so these fire the
 * existing single-item calls in parallel and report partial failure rather
 * than silently succeeding if some (but not all) requests fail.
 */
export interface BulkActionResult {
  succeeded: string[];
  failed: { id: string; message: string }[];
}

export function useBulkArchiveProducts(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productIds: string[]): Promise<BulkActionResult> => {
      const results = await Promise.allSettled(
        productIds.map((id) =>
          browserFetch<void>(`/api/products/${id}`, {
            method: "PATCH",
            body: { storeId, status: "ARCHIVED" },
          }),
        ),
      );

      const succeeded: string[] = [];
      const failed: BulkActionResult["failed"] = [];
      results.forEach((result, i) => {
        const id = productIds[i];
        if (!id) return;
        if (result.status === "fulfilled") succeeded.push(id);
        else failed.push({ id, message: result.reason instanceof Error ? result.reason.message : "Failed" });
      });

      return { succeeded, failed };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.lists() });
    },
  });
}

export function useBulkDeleteProducts(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productIds: string[]): Promise<BulkActionResult> => {
      const results = await Promise.allSettled(
        productIds.map((id) => browserFetch<void>(`/api/products/${id}`, { method: "DELETE", body: { storeId } })),
      );

      const succeeded: string[] = [];
      const failed: BulkActionResult["failed"] = [];
      results.forEach((result, i) => {
        const id = productIds[i];
        if (!id) return;
        if (result.status === "fulfilled") succeeded.push(id);
        else failed.push({ id, message: result.reason instanceof Error ? result.reason.message : "Failed" });
      });

      return { succeeded, failed };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creatorProductKeys.lists() });
    },
  });
}
