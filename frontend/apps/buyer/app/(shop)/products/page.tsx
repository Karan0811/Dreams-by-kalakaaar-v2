import type { Metadata } from "next";
import type { ProductListParams } from "@dbk/types";
import { fetchProductList } from "@dbk/api-client/server";
import { ProductListClient } from "@/components/ProductListClient";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse handmade ceramics, textiles, jewelry, and more from independent creators.",
};

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseParams(sp: { [key: string]: string | string[] | undefined }): ProductListParams {
  const minPrice = firstValue(sp.minPrice);
  const maxPrice = firstValue(sp.maxPrice);

  return {
    categorySlug: firstValue(sp.category),
    creatorSlug: firstValue(sp.creator),
    q: firstValue(sp.q),
    sort: (firstValue(sp.sort) as ProductListParams["sort"]) ?? "newest",
    minPriceMinor: minPrice ? Number(minPrice) : undefined,
    maxPriceMinor: maxPrice ? Number(maxPrice) : undefined,
    inStockOnly: firstValue(sp.inStock) === "true",
  };
}

/**
 * Server-rendered first page (11-frontend-architecture.md §7.4/§7.7) — the
 * grid is meaningfully populated before any JS runs, then `ProductListClient`
 * hydrates over it and owns search/filter/sort URL state plus "Load more"
 * pagination client-side.
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const params = parseParams(resolvedParams);
  const initialPage = await fetchProductList(params);

  return (
    <div className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-400)] lg:px-[var(--space-600)]">
      <h1 className="mb-[var(--space-300)] font-serif text-[28px] text-text-primary">
        {params.categorySlug ? "Category" : "All Products"}
      </h1>
      <ProductListClient params={params} initialPage={initialPage} />
    </div>
  );
}
