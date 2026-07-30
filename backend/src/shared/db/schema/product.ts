import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { stores } from './marketplace';
import { categories } from './categories';
import { media } from './media';
import { inventory } from './inventory';

/**
 * Product domain — 08-database-design.md Section 8.
 *
 * SCOPE NOTE (backend/SCOPE.md): implements `Product`, `ProductVariant`,
 * `ProductMedia`, and `ProductCategory` — the entities basic Product CRUD
 * (create/list/read/update/publish) requires. `ProductSpecification`,
 * `ProductDisclosure`, `ProductSEO`, `ProductAnalytics`,
 * `ProductStatusHistory`, `ProductVersion`, `ProductDraft`,
 * `ProductApproval`, `ProductRecommendation`, `CustomizationOption`/`Value`,
 * `ProductMaterial`/`Technique`, and `ProductTag` are documented in Sections
 * 8.6–8.18 and are deferred to the Products module's full-feature phase.
 */

export const productTypeEnum = pgEnum('product_type', ['READY_MADE', 'MADE_TO_ORDER']);

export const productStatusEnum = pgEnum('product_status', [
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'PAUSED',
  'ARCHIVED',
  'REJECTED',
]);

export const mediaTypeInGalleryEnum = pgEnum('product_media_type', ['IMAGE', 'VIDEO']);

/** 08-database-design.md Section 8.1 — the canonical listing. */
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull(),
    description: text('description').notNull(),
    productType: productTypeEnum('product_type').notNull().default('READY_MADE'),
    status: productStatusEnum('status').notNull().default('DRAFT'),
    leadTimeDays: integer('lead_time_days'),
    primaryCategoryId: uuid('primary_category_id').references(() => categories.id),
    /** Denormalized aggregate counters — 08-database-design.md Section 2.3. */
    averageRating: integer('average_rating').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    unitsSold: integer('units_sold').notNull().default(0),
    wishlistCount: integer('wishlist_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('products_store_slug_unique_idx').on(table.storeId, table.slug),
    index('products_store_status_idx').on(table.storeId, table.status),
    index('products_status_category_idx').on(table.status, table.primaryCategoryId),
    index('products_created_at_idx').on(table.createdAt),
  ],
);

/** 08-database-design.md Section 8.2 — a specific purchasable configuration. */
export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    /** Structured key-value attributes, e.g. { "size": "M", "color": "Indigo" }. */
    attributes: jsonb('attributes').$type<Record<string, string>>().notNull().default({}),
    priceAmount: integer('price_amount').notNull(),
    priceCurrency: varchar('price_currency', { length: 3 }).notNull().default('INR'),
    skuReference: varchar('sku_reference', { length: 64 }),
    status: varchar('status', { length: 16 }).notNull().default('ACTIVE'), // ACTIVE | ARCHIVED
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('product_variants_product_id_idx').on(table.productId),
    uniqueIndex('product_variants_sku_unique_idx').on(table.skuReference),
  ],
);

/** 08-database-design.md Section 8.3 — ordered image/video gallery. */
export const productMedia = pgTable(
  'product_media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'restrict' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    mediaType: mediaTypeInGalleryEnum('media_type').notNull().default('IMAGE'),
    displayOrder: integer('display_order').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
  },
  (table) => [
    index('product_media_product_display_order_idx').on(table.productId, table.displayOrder),
  ],
);

/** 08-database-design.md Section 8.4 — Product ↔ Category join. */
export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    isPrimary: boolean('is_primary').notNull().default(false),
  },
  (table) => [
    uniqueIndex('product_categories_unique_idx').on(table.productId, table.categoryId),
    index('product_categories_category_product_idx').on(table.categoryId, table.productId),
  ],
);

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  primaryCategory: one(categories, {
    fields: [products.primaryCategoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  mediaGallery: many(productMedia),
  productCategories: many(productCategories),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  inventory: one(inventory, {
    fields: [productVariants.id],
    references: [inventory.variantId],
  }),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, { fields: [productMedia.productId], references: [products.id] }),
  media: one(media, { fields: [productMedia.mediaId], references: [media.id] }),
}));
