"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { Product, ProductListParams, ProductListResponse } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { productKeys } from "../query-keys";

/**
 * Builds the query string for the internal BFF route (`app/api/products/route.ts`)
 * using this app's own `ProductListParams` field names directly — the BFF
 * parses these same names back out and hands them to `fetchProductList`,
 * which is what actually translates them into the backend's query contract
 * via `buildFilterParams` (server-only). Kept separate from that translation
 * so it never has to happen twice on one request.
 */
function toBffSearchParams(params: ProductListParams, pageParam?: PageParam): URLSearchParams {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  if (params.minPriceMinor !== undefined) search.set("minPriceMinor", String(params.minPriceMinor));
  if (params.maxPriceMinor !== undefined) search.set("maxPriceMinor", String(params.maxPriceMinor));
  if (params.inStockOnly) search.set("inStockOnly", "true");
  if (pageParam?.cursor) search.set("cursor", pageParam.cursor);
  if (pageParam?.page !== undefined) search.set("page", String(pageParam.page));
  return search;
}

/**
 * Sprint 01: `newest`/`oldest` are keyset-cursor-paginated; `price_asc`/
 * `price_desc`/`best_selling` are page-number-paginated instead (they order
 * by a computed column outside the cursor's tuple — see the backend's
 * `productSortSchema` doc comment). This type lets one `useInfiniteQuery`
 * serve both without the caller needing to know which mode is active.
 */
type PageParam = { cursor?: string; page?: number };

function nextPageParam(lastPage: ProductListResponse): PageParam | undefined {
  if (!lastPage.pagination.hasMore) return undefined;
  if (lastPage.pagination.nextCursor) return { cursor: lastPage.pagination.nextCursor };
  if (lastPage.pagination.page) return { page: lastPage.pagination.page + 1 };
  return undefined;
}

/**
 * Powers the explicit, user-triggered "Load more" pattern
 * (11-frontend-architecture.md §10.6) — never wired to automatic
 * scroll-triggered fetching for buyer-facing catalog browsing.
 */
export function useProducts(params: ProductListParams, initialPage?: ProductListResponse) {
  return useInfiniteQuery({
    queryKey: productKeys.list(params),
    queryFn: async ({ pageParam }: { pageParam: PageParam | undefined }) => {
      const search = toBffSearchParams(params, pageParam);
      return browserFetch<ProductListResponse>(`/api/products?${search.toString()}`);
    },
    initialPageParam: undefined as PageParam | undefined,
    getNextPageParam: (lastPage) => nextPageParam(lastPage),
    staleTime: 60_000, // matches the ISR revalidation window, §9.10
    // Seeds the cache with the server-rendered first page so the client
    // never re-fetches on mount (11-frontend-architecture.md §7.7's
    // server-fetch-then-hydrate pattern).
    initialData: initialPage
      ? { pages: [initialPage], pageParams: [undefined] }
      : undefined,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => browserFetch<Product>(`/api/products/${slug}`),
    staleTime: 5 * 60_000,
    enabled: Boolean(slug),
  });
}
