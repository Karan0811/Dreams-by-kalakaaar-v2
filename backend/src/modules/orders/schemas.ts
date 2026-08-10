import { z } from 'zod';
import { uuidSchema } from '@/shared/validation/common-schemas';

/**
 * Orders module Schemas — Sprint 02. See `shared/db/schema/orders.ts`'s
 * doc comment for the documented assumption this module implements:
 * order-level (not per-store) status, no payment integration.
 */

export const createOrderSchema = z.object({
  shippingAddressId: uuidSchema,
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().trim().max(500).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const listMyOrdersQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListMyOrdersQuery = z.infer<typeof listMyOrdersQuerySchema>;
