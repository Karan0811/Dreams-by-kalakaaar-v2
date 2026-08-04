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
export { fetchCart, addCartItem } from "./endpoints/cart.server";
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
