import {
  index,
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

/**
 * Marketplace domain — 08-database-design.md Section 7.
 *
 * SCOPE NOTE (see backend/SCOPE.md): this phase implements `creators`,
 * `stores`, and `store_verifications` — the entities the Creators/Products
 * modules require. `StoreBranding`, `StorePolicy`, `StoreTeam`,
 * `StoreInvitation`, `StoreSettings`, `StoreSocialLinks`, `StoreFAQ`,
 * `StoreAnnouncement`, and `StoreAnalytics` are documented in
 * 08-database-design.md Sections 7.3–7.13 and are deferred to the phase that
 * builds the full Stores module (10-backend-architecture.md Section 5.5).
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

export const creatorsRelations = relations(creators, ({ one, many }) => ({
  user: one(users, { fields: [creators.userId], references: [users.id] }),
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  creator: one(creators, { fields: [stores.creatorId], references: [creators.id] }),
  verifications: many(storeVerifications),
}));
