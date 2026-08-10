import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './identity';
import { products } from './product';

/**
 * Wishlist domain — Sprint 02 (Marketplace Foundation).
 *
 * A simple User↔Product join, mirroring `product.ts`'s `productCategories`
 * join-table shape. `products.wishlistCount` (already present as a
 * denormalized counter — `product.ts`'s doc comment on that column) is
 * incremented/decremented by this module's Service Layer on add/remove,
 * the same pattern the Products module already uses for its own counters.
 */
export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('wishlist_items_user_product_unique_idx').on(table.userId, table.productId),
    index('wishlist_items_user_id_idx').on(table.userId),
  ],
);

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, { fields: [wishlistItems.userId], references: [users.id] }),
  product: one(products, { fields: [wishlistItems.productId], references: [products.id] }),
}));
