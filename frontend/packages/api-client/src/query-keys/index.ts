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

export const wishlistKeys = {
  all: ["wishlist"] as const,
  list: () => [...wishlistKeys.all, "list"] as const,
};

export const addressKeys = {
  all: ["addresses"] as const,
  list: () => [...addressKeys.all, "list"] as const,
};

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...orderKeys.lists(), params ?? {}] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const,
};

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (productIdOrSlug: string) => [...reviewKeys.all, "list", productIdOrSlug] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params?: Record<string, unknown>) => [...notificationKeys.all, "list", params ?? {}] as const,
};

export const creatorAddressKeys = {
  all: ["creator-addresses"] as const,
  list: () => [...creatorAddressKeys.all, "list"] as const,
};

export const creatorBankDetailKeys = {
  all: ["creator-bank-details"] as const,
  list: () => [...creatorBankDetailKeys.all, "list"] as const,
};

export const creatorSocialLinkKeys = {
  all: ["creator-social-links"] as const,
  list: () => [...creatorSocialLinkKeys.all, "list"] as const,
};

export const creatorDocumentKeys = {
  all: ["creator-documents"] as const,
  list: () => [...creatorDocumentKeys.all, "list"] as const,
};

export const categoryKeys = {
  all: ["categories"] as const,
  list: (params?: Record<string, unknown>) => [...categoryKeys.all, "list", params ?? {}] as const,
  detail: (categoryId: string) => [...categoryKeys.all, "detail", categoryId] as const,
};

export const productVariantKeys = {
  all: ["product-variants"] as const,
  list: (productId: string) => [...productVariantKeys.all, "list", productId] as const,
  inventory: (variantId: string) => [...productVariantKeys.all, "inventory", variantId] as const,
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
};

export const creatorProductKeys = {
  all: ["creator-products"] as const,
  lists: () => [...creatorProductKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) => [...creatorProductKeys.lists(), params] as const,
  details: () => [...creatorProductKeys.all, "detail"] as const,
  detail: (productId: string) => [...creatorProductKeys.details(), productId] as const,
};
