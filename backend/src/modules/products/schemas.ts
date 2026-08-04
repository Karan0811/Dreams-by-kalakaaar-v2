import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from '@/shared/validation/common-schemas';

/** Products module schemas — 08-database-design.md Section 8. */

export const productVariantInputSchema = z.object({
  attributes: z.record(z.string(), z.string()).default({}),
  priceAmount: z.number().int().nonnegative(),
  priceCurrency: z.string().length(3).default('INR'),
  skuReference: z.string().trim().max(64).optional(),
  initialQuantity: z.number().int().nonnegative().default(0),
});

export const createProductSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(20).max(5000),
  productType: z.enum(['READY_MADE', 'MADE_TO_ORDER']).default('READY_MADE'),
  leadTimeDays: z.number().int().positive().max(180).optional(),
  primaryCategoryId: uuidSchema.optional(),
  variants: z.array(productVariantInputSchema).min(1).max(50),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(20).max(5000).optional(),
  leadTimeDays: z.number().int().positive().max(180).optional(),
  primaryCategoryId: uuidSchema.optional(),
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productStatusTransitionSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']),
});
export type ProductStatusTransitionInput = z.infer<typeof productStatusTransitionSchema>;

/**
 * Sort options — Sprint 01. `newest`/`oldest` are keyset-paginated using the
 * existing `(createdAt, id)` cursor tuple (10-backend-architecture.md's
 * established pattern, just generalized to two directions). `priceLow`/
 * `priceHigh`/`bestSelling` order by a computed/denormalized column that
 * doesn't share that tuple, so they intentionally use page-number pagination
 * instead (see `pagination.page` in the response envelope) rather than
 * inventing a keyset scheme for every sort column — a deliberate, documented
 * trade-off (docs/testing/sprint-01-products.md), not an oversight. Full-text
 * search ranking (`09-api-architecture.md`'s eventual Search module, Phase 16
 * of the roadmap) will likely revisit pagination for search results anyway.
 */
export const productSortSchema = z
  .enum(['newest', 'oldest', 'priceLow', 'priceHigh', 'bestSelling'])
  .default('newest');
export type ProductSort = z.infer<typeof productSortSchema>;

const CURSOR_SORTS = new Set<ProductSort>(['newest', 'oldest']);
export function sortUsesCursorPagination(sort: ProductSort): boolean {
  return CURSOR_SORTS.has(sort);
}

/** Shared structured-filter fields for both the public and creator-scoped listing endpoints. */
const productFilterFields = {
  categoryId: uuidSchema.optional(),
  storeId: uuidSchema.optional(),
  productType: z.enum(['READY_MADE', 'MADE_TO_ORDER']).optional(),
  /** Free-text keyword match against title/description (ILIKE, not full-text search — see productSortSchema's note). */
  q: z.string().trim().min(1).max(120).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  inStockOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === 'true'),
  sort: productSortSchema,
  /** Only consulted when `sort` is a non-cursor sort (see sortUsesCursorPagination). */
  page: z.coerce.number().int().min(1).default(1),
};

export const listProductsQuerySchema = paginationQuerySchema
  .extend(productFilterFields)
  .refine((v) => !v.minPrice || !v.maxPrice || v.minPrice <= v.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  });
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

/** Creator-side listing additionally allows filtering by lifecycle status (public listing is always forced to ACTIVE). */
export const listStoreProductsQuerySchema = paginationQuerySchema
  .extend({
    ...productFilterFields,
    status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'ARCHIVED', 'REJECTED']).optional(),
  })
  .refine((v) => !v.minPrice || !v.maxPrice || v.minPrice <= v.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  });
export type ListStoreProductsQuery = z.infer<typeof listStoreProductsQuerySchema>;

/** Sprint 01 — Product Images. Step 1: request a presigned direct-upload URL, creating a PENDING_UPLOAD `media` row. */
export const requestProductMediaUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, 'must be at most 10MB'),
});
export type RequestProductMediaUploadInput = z.infer<typeof requestProductMediaUploadSchema>;

/** Step 2: confirm the direct upload succeeded and attach it to the product's gallery. */
export const attachProductMediaSchema = z.object({
  mediaId: uuidSchema,
  altText: z.string().trim().min(3).max(255),
  variantId: uuidSchema.optional(),
  isPrimary: z.boolean().default(false),
});
export type AttachProductMediaInput = z.infer<typeof attachProductMediaSchema>;

export const updateProductMediaSchema = z.object({
  altText: z.string().trim().min(3).max(255).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
});
export type UpdateProductMediaInput = z.infer<typeof updateProductMediaSchema>;

/**
 * Sprint 01 — Inventory Management. Adjustment is always a signed delta
 * against the current `quantityAvailable`, never a raw overwrite (the
 * roadmap's own Phase 6 Definition of Done), so that concurrent adjustments
 * compose correctly. A full `InventoryTransaction` ledger recording *why*
 * each delta happened (08-database-design.md Section 9.2) is deferred
 * alongside the rest of the Inventory domain per `backend/SCOPE.md` — this
 * still guarantees the arithmetic is never a lost-update overwrite, it just
 * doesn't yet persist a per-adjustment audit row.
 */
export const adjustInventorySchema = z.object({
  quantityDelta: z.number().int().refine((v) => v !== 0, 'must be a non-zero delta'),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  reason: z.string().trim().max(255).optional(),
});
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
