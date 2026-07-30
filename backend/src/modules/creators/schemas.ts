import { z } from 'zod';

/** Creators module schemas — 08-database-design.md Section 7.1. */

export const creatorCategorySchema = z.enum([
  'INDEPENDENT_ARTISAN',
  'CUSTOM_PERSONALIZATION_SPECIALIST',
  'SMALL_CREATIVE_STUDIO',
  'EMERGING_ASPIRING',
]);

export const applyAsCreatorSchema = z.object({
  legalName: z.string().trim().min(2).max(255),
  businessName: z.string().trim().max(255).optional(),
  taxIdentifier: z.string().trim().min(4).max(64).optional(),
  category: creatorCategorySchema,
  storeName: z.string().trim().min(2).max(255),
});
export type ApplyAsCreatorInput = z.infer<typeof applyAsCreatorSchema>;
