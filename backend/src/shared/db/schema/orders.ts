import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './identity';
import { stores } from './marketplace';
import { products, productVariants } from './product';
import { userAddresses } from './user-addresses';

/**
 * Orders domain — Sprint 02 (Marketplace Foundation).
 *
 * ASSUMPTION (documented per this sprint's brief — no dedicated
 * `08-database-design.md` Orders section was in scope for this pass):
 * order status is a single order-level lifecycle rather than a
 * per-store-split fulfillment model. `orderItems.storeId` is still carried
 * on every line item (so a Creator's "My Orders" view can filter to only
 * the items that belong to their Store), but there is one status for the
 * whole Order, not one per Store-within-an-Order. A true multi-vendor
 * split-fulfillment model (separate shipment/status per Store) is a
 * natural Sprint 03 extension once payments exist, since splitting
 * fulfillment without splitting payment capture is only half the feature.
 *
 * No payment integration this sprint (explicit brief constraint) — orders
 * are created directly in `PENDING` without any payment/authorization step.
 *
 * Shipping address is snapshotted onto the Order at creation time (not just
 * a foreign key to `userAddresses`) because an Order must remain accurate
 * even if the buyer later edits or deletes that address — the same
 * snapshot rationale `orderItems` uses for price/title.
 */
export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: varchar('order_number', { length: 32 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: orderStatusEnum('status').notNull().default('PENDING'),
    subtotalAmount: integer('subtotal_amount').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    shippingAddressId: uuid('shipping_address_id').references(() => userAddresses.id, {
      onDelete: 'set null',
    }),
    shippingRecipientName: varchar('shipping_recipient_name', { length: 255 }).notNull(),
    shippingRecipientPhone: varchar('shipping_recipient_phone', { length: 32 }).notNull(),
    shippingLine1: varchar('shipping_line1', { length: 255 }).notNull(),
    shippingLine2: varchar('shipping_line2', { length: 255 }),
    shippingCity: varchar('shipping_city', { length: 128 }).notNull(),
    shippingState: varchar('shipping_state', { length: 128 }).notNull(),
    shippingPostalCode: varchar('shipping_postal_code', { length: 16 }).notNull(),
    shippingCountry: varchar('shipping_country', { length: 2 }).notNull().default('IN'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
    index('orders_created_at_idx').on(table.createdAt),
    index('orders_order_number_idx').on(table.orderNumber),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    /** Snapshotted at order-creation time — must survive the Product/Variant being edited or deleted later. */
    titleSnapshot: varchar('title_snapshot', { length: 200 }).notNull(),
    variantAttributesSnapshot: text('variant_attributes_snapshot'),
    unitPriceAmount: integer('unit_price_amount').notNull(),
    quantity: integer('quantity').notNull(),
    lineTotalAmount: integer('line_total_amount').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_store_id_idx').on(table.storeId),
  ],
);

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    fromStatus: orderStatusEnum('from_status'),
    toStatus: orderStatusEnum('to_status').notNull(),
    changedById: uuid('changed_by_id').references(() => users.id),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('order_status_history_order_id_idx').on(table.orderId)],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  shippingAddress: one(userAddresses, {
    fields: [orders.shippingAddressId],
    references: [userAddresses.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  store: one(stores, { fields: [orderItems.storeId], references: [stores.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
  changedBy: one(users, { fields: [orderStatusHistory.changedById], references: [users.id] }),
}));
