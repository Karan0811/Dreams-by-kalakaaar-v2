"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { ProductDetailResponse, ProductListParams, ProductListResponse } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { buildFilterParams } from "../endpoints/buildFilterParams";
import { productKeys } from "../query-keys";

/**
 * Powers the explicit, user-triggered "Load more" pattern
 * (11-frontend-architecture.md §10.6) — never wired to automatic
 * scroll-triggered fetching for buyer-facing catalog browsing.
 */
export function useProducts(params: ProductListParams, initialPage?: ProductListResponse) {
  return useInfiniteQuery({
    queryKey: productKeys.list(params),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const search = buildFilterParams({ ...params, cursor: pageParam });
      return browserFetch<ProductListResponse>(`/api/products?${search.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.nextCursor ?? undefined) : undefined,
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
    queryFn: () => browserFetch<ProductDetailResponse>(`/api/products/${slug}`),
    staleTime: 5 * 60_000,
    enabled: Boolean(slug),
  });
}
