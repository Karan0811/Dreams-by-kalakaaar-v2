import { z } from 'zod';
import { uuidSchema } from '@/shared/validation/common-schemas';

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

export const updateCreatorProfileSchema = z.object({
  legalName: z.string().trim().min(2).max(255).optional(),
  businessName: z.string().trim().max(255).nullable().optional(),
  taxIdentifier: z.string().trim().min(4).max(64).optional(),
  category: creatorCategorySchema.optional(),
});
export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;

/** Sprint 02 — Creator Address CRUD. */
export const creatorAddressTypeSchema = z.enum(['REGISTERED', 'WAREHOUSE', 'RETURN']);

export const createCreatorAddressSchema = z.object({
  type: creatorAddressTypeSchema.default('REGISTERED'),
  line1: z.string().trim().min(3).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2).max(128),
  state: z.string().trim().min(2).max(128),
  postalCode: z.string().trim().min(3).max(16),
  country: z.string().trim().length(2).default('IN'),
  isDefault: z.boolean().default(false),
});
export type CreateCreatorAddressInput = z.infer<typeof createCreatorAddressSchema>;

export const updateCreatorAddressSchema = createCreatorAddressSchema.partial();
export type UpdateCreatorAddressInput = z.infer<typeof updateCreatorAddressSchema>;

/** Sprint 02 — Creator Bank Details CRUD. Raw account number/IFSC never echoed back post-write (see service.ts). */
export const createCreatorBankDetailsSchema = z.object({
  accountHolderName: z.string().trim().min(2).max(255),
  accountNumber: z.string().trim().min(6).max(34),
  ifscCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'must be a valid IFSC code'),
  bankName: z.string().trim().min(2).max(255),
  branchName: z.string().trim().max(255).optional(),
  isPrimary: z.boolean().default(true),
});
export type CreateCreatorBankDetailsInput = z.infer<typeof createCreatorBankDetailsSchema>;

export const updateCreatorBankDetailsSchema = createCreatorBankDetailsSchema.partial();
export type UpdateCreatorBankDetailsInput = z.infer<typeof updateCreatorBankDetailsSchema>;

/** Sprint 02 — Creator Social Links CRUD. */
export const creatorSocialPlatformSchema = z.enum([
  'INSTAGRAM',
  'FACEBOOK',
  'YOUTUBE',
  'PINTEREST',
  'TWITTER',
  'WEBSITE',
  'OTHER',
]);

export const createCreatorSocialLinkSchema = z.object({
  platform: creatorSocialPlatformSchema,
  url: z.string().trim().url().max(1024),
  displayOrder: z.number().int().min(0).default(0),
});
export type CreateCreatorSocialLinkInput = z.infer<typeof createCreatorSocialLinkSchema>;

export const updateCreatorSocialLinkSchema = z.object({
  url: z.string().trim().url().max(1024).optional(),
  displayOrder: z.number().int().min(0).optional(),
});
export type UpdateCreatorSocialLinkInput = z.infer<typeof updateCreatorSocialLinkSchema>;

/** Sprint 02 — Creator Documents CRUD (KYC/onboarding uploads, reusing the `media` upload-then-attach flow already established by Product Images). */
export const creatorDocumentTypeSchema = z.enum([
  'GOVERNMENT_ID',
  'BUSINESS_REGISTRATION',
  'TAX_CERTIFICATE',
  'BANK_PROOF',
  'ADDRESS_PROOF',
  'OTHER',
]);

export const createCreatorDocumentSchema = z.object({
  mediaId: uuidSchema,
  type: creatorDocumentTypeSchema,
});
export type CreateCreatorDocumentInput = z.infer<typeof createCreatorDocumentSchema>;

/** Step 1 of the document upload flow — mirrors `modules/products/schemas.ts`'s `requestProductMediaUploadSchema`. */
export const requestCreatorDocumentUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, 'must be at most 10MB'),
});
export type RequestCreatorDocumentUploadInput = z.infer<typeof requestCreatorDocumentUploadSchema>;

export const reviewCreatorDocumentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().trim().max(1000).optional(),
});
export type ReviewCreatorDocumentInput = z.infer<typeof reviewCreatorDocumentSchema>;

/** Sprint 02 — Creator Status (admin-only transition). */
export const creatorStatusTransitionSchema = z.object({
  onboardingStatus: z.enum(['APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED', 'CLOSED']),
  reason: z.string().trim().max(1000).optional(),
});
export type CreatorStatusTransitionInput = z.infer<typeof creatorStatusTransitionSchema>;
