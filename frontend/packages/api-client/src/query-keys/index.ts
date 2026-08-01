import type { ProductListParams } from "@dbk/types";

export { createResourceKeys, type ResourceQueryKeys } from "./createResourceKeys";

/**
 * Hierarchical query key factories, one per resource. This is what makes
 * cache invalidation precise (11-frontend-architecture.md §9.6): invalidating
 * `productKeys.lists()` refetches every filtered list view without touching
 * any already-cached `productKeys.detail(id)` entry.
 */
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const,
};

export const cartKeys = {
  all: ["cart"] as const,
  current: () => [...cartKeys.all, "current"] as const,
};

export const sessionKeys = {
  all: ["session"] as const,
  current: () => [...sessionKeys.all, "current"] as const,
};

export const creatorDashboardKeys = {
  all: ["creator-dashboard"] as const,
  pendingActions: () => [...creatorDashboardKeys.all, "pending-actions"] as const,
  performance: (periodLabel: string) =>
    [...creatorDashboardKeys.all, "performance", periodLabel] as const,
  orders: (params?: Record<string, unknown>) =>
    [...creatorDashboardKeys.all, "orders", params ?? {}] as const,
  products: (params?: Record<string, unknown>) =>
    [...creatorDashboardKeys.all, "products", params ?? {}] as const,
};
