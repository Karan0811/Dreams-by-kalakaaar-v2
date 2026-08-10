import { z } from 'zod';
import { uuidSchema } from '@/shared/validation/common-schemas';

export const createReviewSchema = z.object({
  productId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1).max(5000),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(200).nullable().optional(),
  body: z.string().trim().min(1).max(5000).optional(),
});
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const listProductReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListProductReviewsQuery = z.infer<typeof listProductReviewsQuerySchema>;
