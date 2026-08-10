import { z } from 'zod';
import { uuidSchema } from '@/shared/validation/common-schemas';

export const addCartItemSchema = z.object({
  variantId: uuidSchema,
  quantity: z.number().int().min(1).max(99).default(1),
});
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
