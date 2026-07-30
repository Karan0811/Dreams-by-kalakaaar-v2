"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "@dbk/api-client";
import type { ProductListParams, ProductListResponse } from "@dbk/types";
import { Button, ProductCard, Skeleton } from "@dbk/ui";

const sortOptions: { value: NonNullable<ProductListParams["sort"]>; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export function ProductListClient({
  params,
  initialPage,
}: {
  params: ProductListParams;
  initialPage: ProductListResponse;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useProducts(
    params,
    initialPage,
  );

  const products = data?.pages.flatMap((page) => page.data) ?? initialPage.data;

  function updateSort(sort: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sort", sort);
    router.push(`/products?${next.toString()}`);
  }

  return (
    <div>
      <div className="mb-[var(--space-300)] flex items-center justify-between">
        <p className="text-[14px] text-text-secondary">
          {initialPage.pagination.total ?? products.length} products
        </p>
        <label className="flex items-center gap-2 text-[13px]">
          <span className="text-text-secondary">Sort by</span>
          <select
            defaultValue={params.sort ?? "relevance"}
            onChange={(e) => updateSort(e.target.value)}
            className="min-h-[var(--size-touch-target-min)] rounded-md border border-border bg-surface px-2 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-300)] border border-border bg-background-subtle py-[var(--space-1200)] text-center">
          <p className="text-[16px] font-medium text-text-primary">No products match these filters</p>
          <p className="text-[14px] text-text-secondary">Try a different category or clear your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-[var(--space-300)] md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {hasNextPage ? (
        <div className="mt-[var(--space-600)] flex justify-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
          >
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-[var(--space-300)] md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
