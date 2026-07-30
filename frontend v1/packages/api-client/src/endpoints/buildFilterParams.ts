import type { ProductListParams } from "@dbk/types";

/**
 * Builds the `field[operator]=value` query string syntax defined in
 * 09-api-architecture.md §2.8, so every feature's filter UI produces a
 * consistent, correctly-encoded query string rather than hand-rolling its
 * own (11-frontend-architecture.md §10.5).
 */
export function buildFilterParams(params: ProductListParams): URLSearchParams {
  const search = new URLSearchParams();

  if (params.categorySlug) search.set("category", params.categorySlug);
  if (params.creatorSlug) search.set("creator", params.creatorSlug);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.minPriceMinor !== undefined) {
    search.set("price[gte]", String(params.minPriceMinor));
  }
  if (params.maxPriceMinor !== undefined) {
    search.set("price[lte]", String(params.maxPriceMinor));
  }

  return search;
}
