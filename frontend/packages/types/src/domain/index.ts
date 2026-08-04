import type { AvailabilityStatus, Id, Money } from "../shared";

/** Mirrors 08-database-design.md's Creator entity (public-facing subset). */
export interface Creator {
  id: Id;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  tagline: string | null;
  isVerified: boolean;
  city: string | null;
  rating: number | null;
  reviewCount: number;
}

/** Mirrors 08-database-design.md's Category entity. */
export interface Category {
  id: Id;
  slug: string;
  name: string;
  parentId: Id | null;
  imageUrl: string | null;
}

export interface ProductImage {
  id: Id;
  url: string;
  altText: string;
  position: number;
}

export type CustomizationFieldType = "text" | "image" | "choice" | "measurement";

export interface CustomizationField {
  id: Id;
  label: string;
  type: CustomizationFieldType;
  required: boolean;
  options?: string[];
  maxLength?: number;
}

/** Mirrors 08-database-design.md's Product/Listing entity (buyer-facing shape). */
export interface Product {
  id: Id;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  price: Money;
  compareAtPrice: Money | null;
  images: ProductImage[];
  creator: Pick<Creator, "id" | "slug" | "displayName" | "avatarUrl" | "isVerified">;
  category: Pick<Category, "id" | "slug" | "name">;
  availability: AvailabilityStatus;
  rating: number | null;
  reviewCount: number;
  isHandmade: boolean;
  leadTimeDays: number | null;
  customizationFields: CustomizationField[];
  materials: string[];
  tags: string[];
}

export type ProductSummary = Pick<
  Product,
  | "id"
  | "slug"
  | "title"
  | "price"
  | "compareAtPrice"
  | "images"
  | "creator"
  | "availability"
  | "rating"
  | "reviewCount"
>;

export type UserRole = "buyer" | "creator" | "admin" | "moderator" | "support";

/** Mirrors 08-database-design.md's User entity (session-safe subset only —
 * never includes password hashes or tokens, per 12-security-architecture.md). */
export interface SessionUser {
  id: Id;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: UserRole[];
  hasCreatorProfile: boolean;
  emailVerified: boolean;
}

export interface CartLineItem {
  id: Id;
  product: ProductSummary;
  quantity: number;
  customizationSelections: Record<string, string>;
  unitPrice: Money;
}

export interface Cart {
  id: Id;
  items: CartLineItem[];
  subtotal: Money;
  itemCount: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderSummary {
  id: Id;
  orderNumber: string;
  status: OrderStatus;
  placedAt: string;
  total: Money;
  itemCount: number;
  creatorNames: string[];
}

export interface CreatorPendingActions {
  newOrders: number;
  lowStockListings: number;
  unreadMessages: number;
  pendingClarifications: number;
}

export interface CreatorPerformanceSummary {
  periodLabel: string;
  revenue: Money;
  ordersCount: number;
  conversionRate: number;
  averageRating: number | null;
}

/**
 * Sprint 01 — creator-side Product types. Deliberately a separate shape
 * from `Product`/`ProductSummary` above: those model the buyer-facing,
 * aspirational catalog view (rating, reviewCount, creator info) that the
 * backend doesn't fully populate yet. These mirror exactly what
 * modules/products/service.ts's getProductDetail/listProductsForStore
 * actually return, since creator tooling reads and writes the real shape,
 * not a display-optimized projection of it.
 */
export type ProductStatus = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "PAUSED" | "ARCHIVED" | "REJECTED";
export type ProductType = "READY_MADE" | "MADE_TO_ORDER";

export interface CreatorProductVariant {
  id: Id;
  attributes: Record<string, string>;
  priceAmount: number;
  priceCurrency: string;
  skuReference: string | null;
  status: string;
  quantityAvailable: number | null;
  quantityReserved: number | null;
  lowStockThreshold: number | null;
}

export interface CreatorProductMedia {
  id: Id;
  mediaId: Id;
  variantId: Id | null;
  displayOrder: number;
  isPrimary: boolean;
  publicUrl: string | null;
  altText: string | null;
  mimeType: string;
}

export interface CreatorProduct {
  id: Id;
  storeId: Id;
  title: string;
  slug: string;
  description: string;
  productType: ProductType;
  leadTimeDays: number | null;
  primaryCategoryId: Id | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  variants?: CreatorProductVariant[];
  media?: CreatorProductMedia[];
}
