import "server-only";
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
import { apiFetch } from "../client";

/**
 * Creator-scoped Products endpoints (`/v1/stores/{storeId}/products/...`).
 * Every function takes `accessToken` explicitly rather than resolving it
 * internally, so the auth-bridge gap (`@dbk/auth`'s `getBackendAccessToken`
 * doc comment) is visible at every call site instead of hidden behind a
 * function that silently does nothing useful without it.
 */
function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function buildListQuery(params: CreatorProductListParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.sort) {
    const sortMap = {
      newest: "newest",
      oldest: "oldest",
      price_asc: "priceLow",
      price_desc: "priceHigh",
      best_selling: "bestSelling",
    } as const;
    search.set("sort", sortMap[params.sort]);
  }
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.page !== undefined) search.set("page", String(params.page));
  return search.toString();
}

export async function fetchCreatorProducts(
  accessToken: string,
  storeId: string,
  params: CreatorProductListParams,
): Promise<PaginatedResponse<CreatorProduct>> {
  const query = buildListQuery(params);
  return apiFetch<PaginatedResponse<CreatorProduct>>(
    `/stores/${storeId}/products${query ? `?${query}` : ""}`,
    { method: "GET", headers: authHeaders(accessToken), cache: "no-store" },
  );
}

export async function fetchCreatorProduct(
  accessToken: string,
  storeId: string,
  productId: string,
): Promise<{ data: CreatorProduct }> {
  return apiFetch<{ data: CreatorProduct }>(`/stores/${storeId}/products/${productId}`, {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function createCreatorProduct(
  accessToken: string,
  storeId: string,
  payload: CreateProductPayload,
): Promise<{ data: CreatorProduct }> {
  return apiFetch<{ data: CreatorProduct }>(`/stores/${storeId}/products`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export async function updateCreatorProduct(
  accessToken: string,
  storeId: string,
  productId: string,
  payload: UpdateProductPayload,
): Promise<{ data: CreatorProduct }> {
  return apiFetch<{ data: CreatorProduct }>(`/stores/${storeId}/products/${productId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export async function transitionCreatorProductStatus(
  accessToken: string,
  storeId: string,
  productId: string,
  status: "ACTIVE" | "PAUSED" | "ARCHIVED",
): Promise<{ data: CreatorProduct }> {
  return apiFetch<{ data: CreatorProduct }>(`/stores/${storeId}/products/${productId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: { status },
  });
}

export async function deleteCreatorProduct(
  accessToken: string,
  storeId: string,
  productId: string,
): Promise<void> {
  await apiFetch<void>(`/stores/${storeId}/products/${productId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

export async function requestCreatorProductMediaUpload(
  accessToken: string,
  storeId: string,
  productId: string,
  payload: RequestMediaUploadPayload,
): Promise<{ data: MediaUploadUrlResponse }> {
  return apiFetch<{ data: MediaUploadUrlResponse }>(
    `/stores/${storeId}/products/${productId}/media/upload-url`,
    { method: "POST", headers: authHeaders(accessToken), body: payload },
  );
}

export async function attachCreatorProductMedia(
  accessToken: string,
  storeId: string,
  productId: string,
  payload: AttachMediaPayload,
): Promise<void> {
  await apiFetch<void>(`/stores/${storeId}/products/${productId}/media`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export async function deleteCreatorProductMedia(
  accessToken: string,
  storeId: string,
  productId: string,
  productMediaId: string,
): Promise<void> {
  await apiFetch<void>(`/stores/${storeId}/products/${productId}/media/${productMediaId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

export async function adjustCreatorVariantInventory(
  accessToken: string,
  storeId: string,
  productId: string,
  variantId: string,
  payload: AdjustInventoryPayload,
): Promise<void> {
  await apiFetch<void>(
    `/stores/${storeId}/products/${productId}/variants/${variantId}/inventory`,
    { method: "PATCH", headers: authHeaders(accessToken), body: payload },
  );
}
