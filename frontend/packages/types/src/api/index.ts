import type { PaginatedResponse } from "../shared";
import type { Product, ProductSummary, SessionUser } from "../domain";

/** GET /api/products (09-api-architecture.md list endpoint shape). */
export type ProductListResponse = PaginatedResponse<ProductSummary>;

/** GET /api/products/:slug */
export interface ProductDetailResponse {
  data: Product;
}

/** Query params accepted by the product list Route Handler, constructed via
 * @dbk/api-client's buildFilterParams() (11-frontend-architecture.md §10.5).
 *
 * `categorySlug`/`creatorSlug` are kept typed for the Categories/Collections
 * work that's still deferred (backend/SCOPE.md) — there is no slug-resolution
 * endpoint yet, so buildFilterParams does not forward them. Every other
 * field below maps 1:1 to a query param the backend actually accepts today
 * (modules/products/schemas.ts's listProductsQuerySchema). */
export interface ProductListParams {
  categorySlug?: string;
  /** A raw category UUID, already in hand (e.g. a product detail response's
   * `category.id`) — unlike categorySlug above, this is forwarded as-is by
   * buildFilterParams since it needs no slug-resolution endpoint. */
  categoryId?: string;
  creatorSlug?: string;
  q?: string;
  /** newest/oldest are keyset-cursor-paginated; price_asc/price_desc/best_selling
   * use page-number pagination instead (see buildFilterParams's doc comment). */
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "best_selling";
  cursor?: string;
  /** Only meaningful when `sort` is price_asc/price_desc/best_selling. */
  page?: number;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  inStockOnly?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  displayName: string;
  acceptedTerms: true;
}

export interface AuthResponse {
  user: SessionUser;
}

/** Sprint 01 — creator Product CRUD payloads, matching
 * modules/products/schemas.ts's Zod schemas exactly (field-for-field, so
 * a validation error's `details[].field` always matches a real form field). */
export interface CreateProductVariantInput {
  attributes?: Record<string, string>;
  priceAmount: number;
  priceCurrency?: string;
  skuReference?: string;
  initialQuantity?: number;
}

export interface CreateProductPayload {
  title: string;
  description: string;
  productType?: "READY_MADE" | "MADE_TO_ORDER";
  leadTimeDays?: number;
  primaryCategoryId?: string;
  variants: CreateProductVariantInput[];
}

export interface UpdateProductPayload {
  title?: string;
  description?: string;
  leadTimeDays?: number;
  primaryCategoryId?: string;
}

export interface CreatorProductListParams {
  status?: import("../domain").ProductStatus;
  q?: string;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "best_selling";
  cursor?: string;
  page?: number;
}

export interface RequestMediaUploadPayload {
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
}

export interface MediaUploadUrlResponse {
  uploadUrl: string;
  mediaId: string;
  publicUrl: string;
}

export interface AttachMediaPayload {
  mediaId: string;
  altText: string;
  variantId?: string;
  isPrimary?: boolean;
}

export interface AdjustInventoryPayload {
  quantityDelta: number;
  lowStockThreshold?: number;
  reason?: string;
}
