import "server-only";
import type { Product, ProductListParams, ProductListResponse } from "@dbk/types";
import { apiFetch } from "../client";
import { buildFilterParams } from "./buildFilterParams";

/**
 * Server-side-only endpoint functions. Imported by Route Handlers
 * (`app/api/products/route.ts`) and by Server Components fetching directly
 * for ISR/PPP routes (11-frontend-architecture.md §7.4, §7.7) — never
 * imported into a Client Component, which must go through `../hooks` instead.
 *
 * Backend response shape (backend/src/shared/http/response.ts's
 * jsonResource/jsonCollection, 09-api-architecture.md §2.15-2.16, applied
 * consistently across every endpoint): a *collection* response wraps its
 * array under `data` with a `pagination` sibling; a *single-resource*
 * response returns the resource at the root, unwrapped. `fetchProductList`
 * hits a collection endpoint, so `ProductListResponse` (a `data`+
 * `pagination` envelope) is correct. `fetchProductBySlug` hits a
 * single-resource endpoint (`GET /v1/products/{idOrSlug}`) — it must NOT
 * be wrapped, and previously was typed as if it were, which crashed every
 * consumer trying to read `.data` off a response that was already the
 * product itself.
 */
export async function fetchProductList(params: ProductListParams): Promise<ProductListResponse> {
  const search = buildFilterParams(params);
  return apiFetch<ProductListResponse>(`/products?${search.toString()}`, {
    method: "GET",
    next: { revalidate: 60 }, // matches the ISR window, §9.10
  });
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  return apiFetch<Product>(`/products/${slug}`, {
    method: "GET",
    next: { revalidate: 300 },
  });
}
