import type { PaginatedResponse } from "../shared";
import type { Product, ProductSummary, SessionUser } from "../domain";

/** GET /api/products (09-api-architecture.md list endpoint shape). */
export type ProductListResponse = PaginatedResponse<ProductSummary>;

/** GET /api/products/:slug */
export interface ProductDetailResponse {
  data: Product;
}

/** Query params accepted by the product list Route Handler, constructed via
 * @dbk/api-client's buildFilterParams() (11-frontend-architecture.md §10.5). */
export interface ProductListParams {
  categorySlug?: string;
  creatorSlug?: string;
  q?: string;
  sort?: "relevance" | "newest" | "price_asc" | "price_desc" | "rating";
  cursor?: string;
  minPriceMinor?: number;
  maxPriceMinor?: number;
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
