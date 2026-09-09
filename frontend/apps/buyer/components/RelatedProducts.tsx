import { fetchProductList } from "@dbk/api-client/server";
import { ProductCard } from "@dbk/ui";

/**
 * Phase 3 — Related Products. There's no dedicated "similar items"
 * endpoint (no recommendation engine, no purchase-history signal — those
 * are real, separate features), so this uses the one real signal already
 * available on a product detail response: its category. Same category,
 * newest first, excluding the current product, capped at 4.
 */
export async function RelatedProducts({ categoryId, excludeProductId }: { categoryId: string; excludeProductId: string }) {
  // Fetch only what can be rendered plus the current product that may need
  // excluding. This avoids enriching a default 20-product page just to show
  // four cards.
  const result = await fetchProductList({ categoryId, sort: "newest", limit: 5 }).catch(() => null);
  if (!result) return null;

  const related = result.data.filter((p) => p.id !== excludeProductId).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <section className="mt-[var(--space-1200)]" aria-labelledby="related-products-heading">
      <h2 id="related-products-heading" className="mb-[var(--space-300)] font-serif text-[20px] text-text-primary">
        You might also like
      </h2>
      <div className="grid grid-cols-2 gap-[var(--space-300)] md:grid-cols-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
