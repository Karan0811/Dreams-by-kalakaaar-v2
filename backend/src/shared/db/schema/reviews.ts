import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './identity';
import { products } from './product';
import { orderItems } from './orders';

/**
 * Reviews domain — Sprint 02 (Marketplace Foundation).
 *
 * ASSUMPTION: a review is scoped to a Product per User (one review per
 * Product per buyer, `reviews_user_product_unique_idx` below), optionally
 * linked to the `orderItem` that proves a verified purchase — `orderItemId`
 * is nullable because the brief doesn't require purchase-gating reviews,
 * but capturing it when available lets the frontend show a "Verified
 * Purchase" badge, a standard e-commerce review-trust pattern.
 * `products.averageRating`/`reviewCount` (already present as denormalized
 * counters) are recalculated by this module's Service Layer on every
 * create/update/delete, the same pattern already used for
 * `products.wishlistCount`.
 */
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id').references(() => orderItems.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    title: text('title'),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('reviews_user_product_unique_idx').on(table.userId, table.productId),
    index('reviews_product_id_idx').on(table.productId),
  ],
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  orderItem: one(orderItems, { fields: [reviews.orderItemId], references: [orderItems.id] }),
}));
