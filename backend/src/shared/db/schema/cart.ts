import { index, integer, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './identity';
import { productVariants } from './product';

/**
 * Cart domain — Sprint 02 (Marketplace Foundation).
 *
 * One implicit cart per User (no separate `carts` header row — a User's
 * cart is simply "their `cart_items` rows", the same no-header-table
 * simplification the rest of this schema uses where a 1:1-with-User
 * relationship needs no independent lifecycle of its own). Line items key
 * off `productVariants`, not `products` directly, since price and
 * inventory are both variant-level (`product.ts`'s existing model) — this
 * matches how `inventory.ts` and `productMedia.variantId` already treat
 * the variant as the purchasable unit.
 *
 * No payment/checkout integration (explicitly out of scope this sprint) —
 * this table only tracks buyer intent prior to Order creation.
 */
export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('cart_items_user_variant_unique_idx').on(table.userId, table.variantId),
    index('cart_items_user_id_idx').on(table.userId),
  ],
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));
