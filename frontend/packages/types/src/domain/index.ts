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
  /**
   * Sprint 02 — the real purchasable unit backing this catalog projection
   * (`shared/db/schema/product.ts`'s `productVariants`). Optional because
   * the buyer catalog/product-detail page itself is still Sprint 01's
   * aspirational projection (see this file's top-level doc comment) and
   * isn't wired to real Product data yet — but Add to Cart genuinely needs
   * a real `variantId` to call the real Cart backend, so this field lets
   * that connection be made correctly wherever real data *is* available,
   * without fabricating one where it isn't.
   */
  variantId?: Id;
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

/**
 * Sprint 02 — Marketplace Foundation. These mirror the real backend
 * response shapes exactly (field-for-field), the same "Sprint 01 —
 * creator-side Product types" convention documented above: they are not
 * the aspirational buyer-catalog projections (`Product`/`Cart`/`Category`
 * above), they are what `modules/{name}/repository.ts` and `service.ts`
 * actually return today.
 */

export type CreatorAddressType = "REGISTERED" | "WAREHOUSE" | "RETURN";

export interface CreatorAddress {
  id: Id;
  creatorId: Id;
  type: CreatorAddressType;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Never includes the decrypted account number/IFSC — only the display-safe subset `modules/creators/service.ts`'s `toPublicBankDetail` returns. */
export interface CreatorBankDetail {
  id: Id;
  accountHolderName: string;
  accountNumberLast4: string;
  bankName: string;
  branchName: string | null;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreatorSocialPlatform =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "YOUTUBE"
  | "PINTEREST"
  | "TWITTER"
  | "WEBSITE"
  | "OTHER";

export interface CreatorSocialLink {
  id: Id;
  creatorId: Id;
  platform: CreatorSocialPlatform;
  url: string;
  displayOrder: number;
  createdAt: string;
}

export type CreatorDocumentType =
  | "GOVERNMENT_ID"
  | "BUSINESS_REGISTRATION"
  | "TAX_CERTIFICATE"
  | "BANK_PROOF"
  | "ADDRESS_PROOF"
  | "OTHER";

export type CreatorDocumentStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface CreatorDocument {
  id: Id;
  creatorId: Id;
  mediaId: Id;
  type: CreatorDocumentType;
  status: CreatorDocumentStatus;
  reviewerId: Id | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export type CreatorOnboardingStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "SUSPENDED" | "CLOSED";

/** Real Category/Subcategory shape (`shared/db/schema/categories.ts`) — a `NULL` `parentId` is a top-level Category, non-null is a Subcategory. */
export interface CategoryNode {
  id: Id;
  name: string;
  slug: string;
  description: string | null;
  parentId: Id | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Standalone Product Variant CRUD shape — same fields as `CreatorProductVariant` above but as its own type, matching `modules/products/schemas.ts`'s `createProductVariantSchema`/`updateProductVariantSchema` field-for-field. */
export interface ProductVariantRecord {
  id: Id;
  productId: Id;
  attributes: Record<string, string>;
  priceAmount: number;
  priceCurrency: string;
  skuReference: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export interface VariantInventory {
  variantId: Id;
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number | null;
  updatedAt: string | null;
}

export type UserAddressType = "SHIPPING" | "BILLING";

export interface UserAddress {
  id: Id;
  userId: Id;
  label: string;
  type: UserAddressType;
  recipientName: string;
  recipientPhone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistEntry {
  id: Id;
  productId: Id;
  createdAt: string;
  product: {
    id: Id;
    title: string;
    slug: string;
    status: ProductStatus;
  };
}

/** Real Cart shape (`modules/cart/repository.ts`'s `listCartItems` join) — deliberately distinct from the aspirational `Cart`/`CartLineItem` above, which this Sprint's real backend does not produce. */
export interface CartEntry {
  id: Id;
  variantId: Id;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  variant: {
    id: Id;
    productId: Id;
    attributes: Record<string, string>;
    priceAmount: number;
    priceCurrency: string;
    status: "ACTIVE" | "ARCHIVED";
  };
  product: {
    id: Id;
    title: string;
    slug: string;
    status: ProductStatus;
  };
  quantityAvailable: number | null;
}

export interface CartState {
  items: CartEntry[];
  itemCount: number;
  subtotalAmount: number;
  currency: string;
}

export type RealOrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderItemRecord {
  id: Id;
  orderId: Id;
  storeId: Id;
  productId: Id;
  variantId: Id;
  titleSnapshot: string;
  variantAttributesSnapshot: string | null;
  unitPriceAmount: number;
  quantity: number;
  lineTotalAmount: number;
  createdAt: string;
}

export interface OrderStatusHistoryEntry {
  id: Id;
  orderId: Id;
  fromStatus: RealOrderStatus | null;
  toStatus: RealOrderStatus;
  changedById: Id | null;
  note: string | null;
  createdAt: string;
}

/** Matches `modules/orders/repository.ts`'s `listOrdersForUser` row shape — the summary/list form, no items/history joined in. */
export interface OrderRecord {
  id: Id;
  orderNumber: string;
  userId: Id;
  status: RealOrderStatus;
  subtotalAmount: number;
  currency: string;
  shippingRecipientName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches `modules/orders/repository.ts`'s `findOrderById` shape — the detail form, with items + status history joined in. */
export interface OrderDetail extends OrderRecord {
  items: OrderItemRecord[];
  statusHistory: OrderStatusHistoryEntry[];
}

export interface ReviewRecord {
  id: Id;
  productId: Id;
  userId: Id;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  authorDisplayName: string;
}

export type NotificationType =
  | "ORDER_STATUS_CHANGED"
  | "ORDER_CANCELLED"
  | "PRODUCT_REVIEW_RECEIVED"
  | "CREATOR_APPLICATION_STATUS"
  | "CREATOR_DOCUMENT_REVIEWED"
  | "LOW_STOCK_ALERT"
  | "GENERAL";

export interface NotificationRecord {
  id: Id;
  userId: Id;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
