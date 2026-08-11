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

/**
 * Mirrors the password policy enforced server-side
 * (`backend/src/shared/validation/common-schemas.ts`'s `passwordSchema`,
 * 12-security-architecture.md). FIX: this previously said `min(10)` despite
 * the comment claiming to mirror the backend, which requires 12 — a
 * password of exactly 10 or 11 characters passed this validation and
 * Better Auth's own (also-wrong) 10-char minimum, only to be rejected by
 * the backend's real `/v1/auth/register` call during the auth bridge,
 * silently stranding the account (see `better-auth.config.ts`'s
 * `minPasswordLength` fix for the other half of this).
 */
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
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

/**
 * Sprint 02 — matches the real backend contract
 * (`modules/cart/schemas.ts`'s `addCartItemSchema`): a Cart line item is
 * keyed on `variantId`, not `productId` — price and inventory are both
 * variant-level. Replaces the Sprint 01 placeholder shape above, which
 * modeled a `productId` + `customizationSelections` cart the real backend
 * was never built to accept.
 */
export const addCartItemSchema = z.object({
  variantId: z.string().uuid("Invalid variant id"),
  quantity: z.number().int().min(1).max(99).default(1),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

/**
 * Sprint 01 — creator Product form. Mirrors
 * backend/src/modules/products/schemas.ts's createProductSchema field-for-
 * field (including messages, where practical) so a client-side validation
 * error and a server-side one never disagree about what's wrong.
 */
export const productVariantFormSchema = z.object({
  priceAmount: z
    .number()
    .int("Price must be a whole number of paise")
    .positive("Price must be greater than 0"),
  skuReference: z.string().trim().max(64).optional(),
  initialQuantity: z.number().int().min(0).default(0),
});
export type ProductVariantFormInput = z.infer<typeof productVariantFormSchema>;

export const productFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(5000),
  productType: z.enum(["READY_MADE", "MADE_TO_ORDER"]),
  leadTimeDays: z.number().int().min(0).max(180).optional(),
  primaryCategoryId: z.string().uuid("Enter a valid category id").optional().or(z.literal("")),
  variants: z.array(productVariantFormSchema).min(1, "Add at least one variant"),
});
export type ProductFormInput = z.infer<typeof productFormSchema>;

/** Edit form only — mirrors updateProductSchema exactly. There is no
 * backend endpoint to edit variants after creation (only at creation time),
 * so this deliberately excludes them; the edit page shows variants
 * read-only alongside a separate inventory-adjustment control. */
export const productEditFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(5000),
  leadTimeDays: z.number().int().min(0).max(180).optional(),
  primaryCategoryId: z.string().uuid("Enter a valid category id").optional().or(z.literal("")),
});
export type ProductEditFormInput = z.infer<typeof productEditFormSchema>;

