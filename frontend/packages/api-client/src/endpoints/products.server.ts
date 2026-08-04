import "server-only";
import type { ProductDetailResponse, ProductListParams, ProductListResponse } from "@dbk/types";
import { apiFetch } from "../client";
import { buildFilterParams } from "./buildFilterParams";

/**
 * Server-side-only endpoint functions. Imported by Route Handlers
 * (`app/api/products/route.ts`) and by Server Components fetching directly
 * for ISR/PPP routes (11-frontend-architecture.md §7.4, §7.7) — never
 * imported into a Client Component, which must go through `../hooks` instead.
 */
export async function fetchProductList(params: ProductListParams): Promise<ProductListResponse> {
  const search = buildFilterParams(params);
  return apiFetch<ProductListResponse>(`/products?${search.toString()}`, {
    method: "GET",
    next: { revalidate: 60 }, // matches the ISR window, §9.10
  });
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/products/${slug}`, {
    method: "GET",
    next: { revalidate: 300 },
  });
}
