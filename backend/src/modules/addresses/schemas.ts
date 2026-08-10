import { z } from 'zod';

/**
 * User Addresses module Schemas — Sprint 02 (Marketplace Foundation).
 * Mirrors `modules/creators/schemas.ts`'s address schemas in shape, plus
 * `label`/`recipientName`/`recipientPhone` since a buyer's saved addresses
 * are named per-location and need a delivery contact.
 */

export const userAddressTypeSchema = z.enum(['SHIPPING', 'BILLING']);

export const createUserAddressSchema = z.object({
  label: z.string().trim().min(1).max(64).default('Home'),
  type: userAddressTypeSchema.default('SHIPPING'),
  recipientName: z.string().trim().min(2).max(255),
  recipientPhone: z.string().trim().min(6).max(32),
  line1: z.string().trim().min(3).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2).max(128),
  state: z.string().trim().min(2).max(128),
  postalCode: z.string().trim().min(3).max(16),
  country: z.string().trim().length(2).default('IN'),
  isDefault: z.boolean().default(false),
});
export type CreateUserAddressInput = z.infer<typeof createUserAddressSchema>;

export const updateUserAddressSchema = createUserAddressSchema.partial();
export type UpdateUserAddressInput = z.infer<typeof updateUserAddressSchema>;
