/**
 * Server-only entry point (`@dbk/api-client/server`). Every function here
 * either calls the upstream REST API directly (via `apiFetch`, which reads
 * `API_BASE_URL` and is guarded with `import "server-only"`) or wraps one
 * that does. Only import this from Route Handlers and Server
 * Components/layouts — never from a file that also renders in the browser.
 */
export { apiFetch, type RequestOptions } from "./client";
export { ApiError } from "./errors";
export { buildFilterParams } from "./endpoints/buildFilterParams";
export { fetchProductList, fetchProductBySlug } from "./endpoints/products.server";
export { fetchCreatorPendingActions, fetchCreatorPerformance } from "./endpoints/creator-dashboard.server";
export {
  fetchCreatorProducts,
  fetchCreatorProduct,
  createCreatorProduct,
  updateCreatorProduct,
  transitionCreatorProductStatus,
  deleteCreatorProduct,
  requestCreatorProductMediaUpload,
  attachCreatorProductMedia,
  deleteCreatorProductMedia,
  adjustCreatorVariantInventory,
} from "./endpoints/creator-products.server";
export { fetchMyCreatorApplication, type CreatorApplicationResponse } from "./endpoints/creator-application.server";

// Sprint 02 — Marketplace Foundation
export { fetchWishlist, addWishlistItem, removeWishlistItem } from "./endpoints/wishlist.server";
export {
  fetchMyAddresses,
  createMyAddress,
  updateMyAddress,
  deleteMyAddress,
} from "./endpoints/user-addresses.server";
export { fetchMyOrders, fetchMyOrder, createOrder, cancelOrder } from "./endpoints/orders.server";
export { fetchProductReviews, createReview, updateReview, deleteReview } from "./endpoints/reviews.server";
export {
  fetchMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "./endpoints/notifications.server";
export {
  fetchCreatorAddresses,
  createCreatorAddress,
  updateCreatorAddress,
  deleteCreatorAddress,
  fetchCreatorBankDetails,
  createCreatorBankDetail,
  updateCreatorBankDetail,
  deleteCreatorBankDetail,
  fetchCreatorSocialLinks,
  createCreatorSocialLink,
  updateCreatorSocialLink,
  deleteCreatorSocialLink,
  fetchCreatorDocuments,
  requestCreatorDocumentUpload,
  createCreatorDocument,
  deleteCreatorDocument,
} from "./endpoints/creator-profile.server";
export {
  fetchCategories,
  fetchCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryParent,
} from "./endpoints/categories.server";
export {
  fetchProductVariants,
  createProductVariant,
  updateProductVariant,
  archiveProductVariant,
  fetchVariantInventory,
} from "./endpoints/product-variants.server";
export { addCartItem, updateCartItem, removeCartItem, fetchCart } from "./endpoints/cart.server";
