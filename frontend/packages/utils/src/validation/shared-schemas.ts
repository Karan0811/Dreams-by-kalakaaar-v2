import { z } from "zod";

/**
 * Base, reusable field schemas. Feature-specific schemas
 * (e.g. `apps/buyer/features/checkout/schemas/addressSchema.ts`) compose
 * these rather than redefining validation rules ad hoc, per
 * 11-frontend-architecture.md §11.2 — a change to what counts as a valid
 * value is made once, here, and applies everywhere.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

/** Mirrors the password policy enforced server-side (12-security-architecture.md). */
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

/** Indian mobile numbers (10 digits, optionally with +91 prefix). */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

/** Indian postal (PIN) code — 6 digits, first digit 1-9. */
export const pinCodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be under 80 characters");

export const addCartItemSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
  quantity: z.number().int().min(1).max(20),
  customizationSelections: z.record(z.string(), z.string()).optional(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const addressSchema = z.object({
  fullName: displayNameSchema,
  phone: phoneSchema,
  line1: z.string().trim().min(1, "Address line is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  pinCode: pinCodeSchema,
});

export type AddressInput = z.infer<typeof addressSchema>;
