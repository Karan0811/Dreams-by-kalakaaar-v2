import "server-only";
import type {
  CreateProductVariantPayload,
  ProductVariantRecord,
  UpdateProductVariantPayload,
  VariantInventory,
} from "@dbk/types";
import { apiFetch } from "../client";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function fetchProductVariants(
  accessToken: string,
  storeId: string,
  productId: string,
): Promise<{ data: ProductVariantRecord[] }> {
  return apiFetch<{ data: ProductVariantRecord[] }>(
    `/stores/${storeId}/products/${productId}/variants`,
    { method: "GET", headers: authHeaders(accessToken), cache: "no-store" },
  );
}

export async function createProductVariant(
  accessToken: string,
  storeId: string,
  productId: string,
  input: CreateProductVariantPayload,
): Promise<ProductVariantRecord> {
  return apiFetch<ProductVariantRecord>(`/stores/${storeId}/products/${productId}/variants`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function updateProductVariant(
  accessToken: string,
  storeId: string,
  productId: string,
  variantId: string,
  input: UpdateProductVariantPayload,
): Promise<ProductVariantRecord> {
  return apiFetch<ProductVariantRecord>(
    `/stores/${storeId}/products/${productId}/variants/${variantId}`,
    { method: "PATCH", headers: authHeaders(accessToken), body: input },
  );
}

/** Archives (not a hard delete — see `modules/products/repository.ts`'s `archiveProductVariant`). */
export async function archiveProductVariant(
  accessToken: string,
  storeId: string,
  productId: string,
  variantId: string,
): Promise<ProductVariantRecord> {
  return apiFetch<ProductVariantRecord>(
    `/stores/${storeId}/products/${productId}/variants/${variantId}`,
    { method: "DELETE", headers: authHeaders(accessToken) },
  );
}

export async function fetchVariantInventory(
  accessToken: string,
  storeId: string,
  productId: string,
  variantId: string,
): Promise<VariantInventory> {
  return apiFetch<VariantInventory>(
    `/stores/${storeId}/products/${productId}/variants/${variantId}/inventory`,
    { method: "GET", headers: authHeaders(accessToken), cache: "no-store" },
  );
}
