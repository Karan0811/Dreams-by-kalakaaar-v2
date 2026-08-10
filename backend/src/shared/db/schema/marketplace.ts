import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './identity';
import { media } from './media';

/**
 * Marketplace domain — 08-database-design.md Section 7.
 *
 * SCOPE NOTE (see backend/SCOPE.md, updated Sprint 02): this phase
 * implements `creators`, `stores`, `store_verifications`, plus the Creator
 * profile-extension tables `creator_addresses`, `creator_bank_details`,
 * `creator_social_links`, and `creator_documents` (Sprint 02 — Marketplace
 * Foundation; these back the Creator module's Address/Bank/Social/Documents
 * CRUD). `StoreBranding`, `StorePolicy`, `StoreTeam`, `StoreInvitation`,
 * `StoreSettings`, `StoreFAQ`, `StoreAnnouncement`, and `StoreAnalytics`
 * remain out of scope, documented in 08-database-design.md Sections 7.3–7.13,
 * deferred to the phase that builds the full Stores module
 * (10-backend-architecture.md Section 5.5).
 */

export const creatorCategoryEnum = pgEnum('creator_category', [
  'INDEPENDENT_ARTISAN',
  'CUSTOM_PERSONALIZATION_SPECIALIST',
  'SMALL_CREATIVE_STUDIO',
  'EMERGING_ASPIRING',
]);

export const creatorOnboardingStatusEnum = pgEnum('creator_onboarding_status', [
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'ACTIVE',
  'SUSPENDED',
  'CLOSED',
]);

export const storeStatusEnum = pgEnum('store_status', [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'SUSPENDED',
  'CLOSED',
]);

export const storeVerificationStatusEnum = pgEnum('store_verification_status', [
  'PENDING',
  'IN_REVIEW',
  'VERIFIED',
  'REJECTED',
  'REVOKED',
]);

/** 08-database-design.md Section 7.1 — marks a User as an approved seller. */
export const creators = pgTable(
  'creators',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    legalName: varchar('legal_name', { length: 255 }).notNull(),
    businessName: varchar('business_name', { length: 255 }),
    /** Encrypted at the application layer before write (08-database-design.md Section 29.1). */
    taxIdentifierEncrypted: text('tax_identifier_encrypted'),
    category: creatorCategoryEnum('category').notNull(),
    onboardingStatus: creatorOnboardingStatusEnum('onboarding_status')
      .notNull()
      .default('PENDING_REVIEW'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('creators_user_id_unique_idx').on(table.userId),
    index('creators_onboarding_status_idx').on(table.onboardingStatus),
  ],
);

/** 08-database-design.md Section 7.2 — the buyer-facing storefront entity. */
export const stores = pgTable(
  'stores',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    tagline: varchar('tagline', { length: 160 }),
    description: text('description'),
    status: storeStatusEnum('status').notNull().default('DRAFT'),
    craftFocus: varchar('craft_focus', { length: 128 }),
    launchDate: timestamp('launch_date', { withTimezone: true }),
    /** Immutable once the store has any published Product or completed Order (Section 7.2). */
    slugLocked: text('slug_locked').notNull().default('false'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('stores_slug_unique_idx').on(table.slug),
    index('stores_status_idx').on(table.status),
    index('stores_creator_id_idx').on(table.creatorId),
  ],
);

/** 08-database-design.md Section 7.5 — platform authenticity/quality verification. */
export const storeVerifications = pgTable(
  'store_verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    status: storeVerificationStatusEnum('status').notNull().default('PENDING'),
    evidenceMediaIds: uuid('evidence_media_ids').array(),
    reviewerId: uuid('reviewer_id').references(() => users.id),
    decisionNotes: text('decision_notes'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    reVerificationDueAt: timestamp('re_verification_due_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('store_verifications_status_idx').on(table.status),
    index('store_verifications_store_id_idx').on(table.storeId),
  ],
);

/** Sprint 02 — Creator module. 08-database-design.md Section 7.1's address extension. */
export const creatorAddressTypeEnum = pgEnum('creator_address_type', [
  'REGISTERED',
  'WAREHOUSE',
  'RETURN',
]);

/** Sprint 02 — a Creator's registered/warehouse/return address(es). */
export const creatorAddresses = pgTable(
  'creator_addresses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),
    type: creatorAddressTypeEnum('type').notNull().default('REGISTERED'),
    line1: varchar('line1', { length: 255 }).notNull(),
    line2: varchar('line2', { length: 255 }),
    city: varchar('city', { length: 128 }).notNull(),
    state: varchar('state', { length: 128 }).notNull(),
    postalCode: varchar('postal_code', { length: 16 }).notNull(),
    country: varchar('country', { length: 2 }).notNull().default('IN'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('creator_addresses_creator_id_idx').on(table.creatorId),
    index('creator_addresses_creator_default_idx').on(table.creatorId, table.isDefault),
  ],
);

/**
 * Sprint 02 — Creator payout bank details. Account number and IFSC are
 * encrypted at the application layer before write, following the same
 * `field-encryption` pattern already established for
 * `creators.taxIdentifierEncrypted` (08-database-design.md Section 29.1) —
 * this is sensitive financial PII, not a field to ever store or log in
 * plaintext.
 */
export const creatorBankDetails = pgTable(
  'creator_bank_details',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),
    accountHolderName: varchar('account_holder_name', { length: 255 }).notNull(),
    accountNumberEncrypted: text('account_number_encrypted').notNull(),
    /** Last 4 digits kept in plaintext for display purposes only (e.g. "•••• 1234"). */
    accountNumberLast4: varchar('account_number_last4', { length: 4 }).notNull(),
    ifscCodeEncrypted: text('ifsc_code_encrypted').notNull(),
    bankName: varchar('bank_name', { length: 255 }).notNull(),
    branchName: varchar('branch_name', { length: 255 }),
    isVerified: boolean('is_verified').notNull().default(false),
    isPrimary: boolean('is_primary').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('creator_bank_details_creator_id_idx').on(table.creatorId)],
);

export const creatorSocialPlatformEnum = pgEnum('creator_social_platform', [
  'INSTAGRAM',
  'FACEBOOK',
  'YOUTUBE',
  'PINTEREST',
  'TWITTER',
  'WEBSITE',
  'OTHER',
]);

/** Sprint 02 — a Creator's public social/portfolio links, shown on their Store page. */
export const creatorSocialLinks = pgTable(
  'creator_social_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),
    platform: creatorSocialPlatformEnum('platform').notNull(),
    url: varchar('url', { length: 1024 }).notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('creator_social_links_creator_id_idx').on(table.creatorId),
    uniqueIndex('creator_social_links_creator_platform_unique_idx').on(
      table.creatorId,
      table.platform,
    ),
  ],
);

export const creatorDocumentTypeEnum = pgEnum('creator_document_type', [
  'GOVERNMENT_ID',
  'BUSINESS_REGISTRATION',
  'TAX_CERTIFICATE',
  'BANK_PROOF',
  'ADDRESS_PROOF',
  'OTHER',
]);

export const creatorDocumentStatusEnum = pgEnum('creator_document_status', [
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
]);

/** Sprint 02 — KYC/onboarding documents a Creator uploads for platform review. */
export const creatorDocuments = pgTable(
  'creator_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'restrict' }),
    type: creatorDocumentTypeEnum('type').notNull(),
    status: creatorDocumentStatusEnum('status').notNull().default('PENDING_REVIEW'),
    reviewerId: uuid('reviewer_id').references(() => users.id),
    reviewNotes: text('review_notes'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('creator_documents_creator_id_idx').on(table.creatorId),
    index('creator_documents_status_idx').on(table.status),
  ],
);

export const creatorsRelations = relations(creators, ({ one, many }) => ({
  user: one(users, { fields: [creators.userId], references: [users.id] }),
  stores: many(stores),
  addresses: many(creatorAddresses),
  bankDetails: many(creatorBankDetails),
  socialLinks: many(creatorSocialLinks),
  documents: many(creatorDocuments),
}));

export const creatorAddressesRelations = relations(creatorAddresses, ({ one }) => ({
  creator: one(creators, { fields: [creatorAddresses.creatorId], references: [creators.id] }),
}));

export const creatorBankDetailsRelations = relations(creatorBankDetails, ({ one }) => ({
  creator: one(creators, { fields: [creatorBankDetails.creatorId], references: [creators.id] }),
}));

export const creatorSocialLinksRelations = relations(creatorSocialLinks, ({ one }) => ({
  creator: one(creators, { fields: [creatorSocialLinks.creatorId], references: [creators.id] }),
}));

export const creatorDocumentsRelations = relations(creatorDocuments, ({ one }) => ({
  creator: one(creators, { fields: [creatorDocuments.creatorId], references: [creators.id] }),
  media: one(media, { fields: [creatorDocuments.mediaId], references: [media.id] }),
  reviewer: one(users, { fields: [creatorDocuments.reviewerId], references: [users.id] }),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  creator: one(creators, { fields: [stores.creatorId], references: [creators.id] }),
  verifications: many(storeVerifications),
}));
