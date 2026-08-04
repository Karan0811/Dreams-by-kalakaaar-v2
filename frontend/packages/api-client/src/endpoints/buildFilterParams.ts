import type { ProductListParams } from "@dbk/types";

/**
 * Sprint 01: translates this app's `ProductListParams` shape directly into
 * the query params `modules/products/schemas.ts`'s `listProductsQuerySchema`
 * actually accepts on the backend — `q`, `minPrice`/`maxPrice` (integer minor
 * units), `inStockOnly`, `sort`, and either `cursor` (newest/oldest) or
 * `page` (price/best-selling sorts, which order by a computed column outside
 * the cursor's tuple; see useProducts.ts's doc comment for how pagination
 * switches between the two transparently).
 *
 * `categorySlug`/`creatorSlug` are intentionally not forwarded — there is no
 * slug-resolution endpoint yet (Categories/Collections are still deferred
 * per backend/SCOPE.md). `categoryId`, added for Related Products, IS
 * forwarded: it's a raw UUID a caller already has (a product detail
 * response's `category.id`), not a slug needing resolution.
 */
const FRONTEND_TO_BACKEND_SORT = {
  newest: "newest",
  oldest: "oldest",
  price_asc: "priceLow",
  price_desc: "priceHigh",
  best_selling: "bestSelling",
} as const satisfies Record<NonNullable<ProductListParams["sort"]>, string>;

export function buildFilterParams(params: ProductListParams): URLSearchParams {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.categoryId) search.set("categoryId", params.categoryId);
  if (params.sort) search.set("sort", FRONTEND_TO_BACKEND_SORT[params.sort]);
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.minPriceMinor !== undefined) search.set("minPrice", String(params.minPriceMinor));
  if (params.maxPriceMinor !== undefined) search.set("maxPrice", String(params.maxPriceMinor));
  if (params.inStockOnly) search.set("inStockOnly", "true");

  return search;
}
