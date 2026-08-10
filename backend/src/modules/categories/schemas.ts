import { z } from 'zod';
import { uuidSchema } from '@/shared/validation/common-schemas';

/**
 * Categories module — Sprint 02. Category and Subcategory share one
 * table/schema/module (see `shared/db/schema/categories.ts`'s scope note):
 * a `parentId: null` create is a top-level Category, a create with
 * `parentId` set is a Subcategory of it.
 */
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(128)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be a lowercase, hyphen-separated slug');

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(128),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).optional(),
  parentId: uuidSchema.nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(128).optional(),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const listCategoriesQuerySchema = z.object({
  /** Omitted = top-level Categories only. Pass a Category's id to list its Subcategories. */
  parentId: uuidSchema.optional(),
  /** When true, returns every Category (top-level and Subcategories) flat, ignoring `parentId`. */
  flat: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === 'true'),
});
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

export const setCategoryParentSchema = z.object({
  parentId: uuidSchema.nullable(),
});
export type SetCategoryParentInput = z.infer<typeof setCategoryParentSchema>;
