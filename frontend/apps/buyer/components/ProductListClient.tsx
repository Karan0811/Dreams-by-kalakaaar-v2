"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { useProducts } from "@dbk/api-client";
import type { ProductListParams, ProductListResponse } from "@dbk/types";
import {
  Button,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  Label,
  ProductCard,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@dbk/ui";

const sortOptions: { value: NonNullable<ProductListParams["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "best_selling", label: "Best Selling" },
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
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError, refetch } = useProducts(
    params,
    initialPage,
  );

  const [searchDraft, setSearchDraft] = useState(params.q ?? "");
  const [minPriceDraft, setMinPriceDraft] = useState(
    params.minPriceMinor !== undefined ? String(params.minPriceMinor / 100) : "",
  );
  const [maxPriceDraft, setMaxPriceDraft] = useState(
    params.maxPriceMinor !== undefined ? String(params.maxPriceMinor / 100) : "",
  );

  const products = data?.pages.flatMap((page) => page.data) ?? initialPage.data;
  const totalCount = initialPage.pagination.totalCount;
  const hasActiveFilters = Boolean(params.q || params.minPriceMinor || params.maxPriceMinor || params.inStockOnly);

  function pushFilters(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/products?${next.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushFilters({ q: searchDraft || undefined });
  }

  function handleSearchClear() {
    setSearchDraft("");
    pushFilters({ q: undefined });
  }

  function handlePriceApply() {
    const minRupees = minPriceDraft ? Number(minPriceDraft) : undefined;
    const maxRupees = maxPriceDraft ? Number(maxPriceDraft) : undefined;
    pushFilters({
      minPrice: minRupees !== undefined && !Number.isNaN(minRupees) ? String(Math.round(minRupees * 100)) : undefined,
      maxPrice: maxRupees !== undefined && !Number.isNaN(maxRupees) ? String(Math.round(maxRupees * 100)) : undefined,
    });
  }

  function handleClearAll() {
    setSearchDraft("");
    setMinPriceDraft("");
    setMaxPriceDraft("");
    router.push("/products");
  }

  return (
    <div>
      {/* Search + Filters */}
      <div className="mb-[var(--space-400)] flex flex-col gap-[var(--space-300)]">
        <form onSubmit={handleSearchSubmit} className="max-w-md">
          <SearchInput
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onClear={handleSearchClear}
            placeholder="Search products…"
            aria-label="Search products"
          />
        </form>

        <div className="flex flex-wrap items-end gap-[var(--space-300)]">
          <div className="flex items-end gap-2">
            <div>
              <Label htmlFor="min-price">Min price (₹)</Label>
              <Input
                id="min-price"
                type="number"
                inputMode="decimal"
                min={0}
                value={minPriceDraft}
                onChange={(e) => setMinPriceDraft(e.target.value)}
                onBlur={handlePriceApply}
                className="w-28"
              />
            </div>
            <div>
              <Label htmlFor="max-price">Max price (₹)</Label>
              <Input
                id="max-price"
                type="number"
                inputMode="decimal"
                min={0}
                value={maxPriceDraft}
                onChange={(e) => setMaxPriceDraft(e.target.value)}
                onBlur={handlePriceApply}
                className="w-28"
              />
            </div>
          </div>

          <div className="flex min-h-[var(--size-touch-target-min)] items-center gap-2 text-[13px]">
            <Checkbox
              id="in-stock-only"
              checked={params.inStockOnly ?? false}
              onCheckedChange={(checked) => pushFilters({ inStock: checked ? "true" : undefined })}
            />
            <Label htmlFor="in-stock-only" className="font-normal text-text-secondary">
              In stock only
            </Label>
          </div>

          {hasActiveFilters ? (
            <Button variant="tertiary" size="sm" onClick={handleClearAll}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-[var(--space-300)] flex items-center justify-between">
        <p className="text-[14px] text-text-secondary" aria-live="polite">
          {totalCount ?? products.length} products
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-select" className="text-[13px] font-normal text-text-secondary">
            Sort by
          </Label>
          <Select
            defaultValue={params.sort ?? "newest"}
            onValueChange={(value) => pushFilters({ sort: value })}
          >
            <SelectTrigger id="sort-select" className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Couldn't load products"
          description="Something went wrong fetching this page."
          onRetry={() => refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No products match these filters"
          description="Try a different search term or clear your filters."
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={handleClearAll}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
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
