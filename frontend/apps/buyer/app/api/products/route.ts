import { NextRequest, NextResponse } from "next/server";
import { fetchProductList, ApiError } from "@dbk/api-client/server";
import type { ProductListParams } from "@dbk/types";

/**
 * The only thing Client Components are ever allowed to call for product
 * listings — this Route Handler is the BFF boundary
 * (11-frontend-architecture.md §10.1). It never holds business logic beyond
 * translating the request into a call to the upstream REST API via
 * `fetchProductList`, which owns the actual backend query-param translation
 * (`@dbk/api-client`'s `buildFilterParams`).
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const minPriceMinor = sp.get("minPriceMinor");
  const maxPriceMinor = sp.get("maxPriceMinor");
  const page = sp.get("page");

  const params: ProductListParams = {
    categorySlug: sp.get("category") ?? undefined,
    categoryId: sp.get("categoryId") ?? undefined,
    creatorSlug: sp.get("creator") ?? undefined,
    q: sp.get("q") ?? undefined,
    sort: (sp.get("sort") as ProductListParams["sort"]) ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    page: page ? Number(page) : undefined,
    minPriceMinor: minPriceMinor ? Number(minPriceMinor) : undefined,
    maxPriceMinor: maxPriceMinor ? Number(maxPriceMinor) : undefined,
    inStockOnly: sp.get("inStockOnly") === "true",
  };

  try {
    const result = await fetchProductList(params);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, correlationId: error.correlationId } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong.", correlationId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
