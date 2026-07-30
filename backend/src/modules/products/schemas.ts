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

export const listProductsQuerySchema = paginationQuerySchema.extend({
  categoryId: uuidSchema.optional(),
  storeId: uuidSchema.optional(),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
