import { index, integer, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * Inventory domain — 08-database-design.md Section 9.
 *
 * SCOPE NOTE (backend/SCOPE.md): implements the one-to-one `inventory` row
 * per `ProductVariant` that the Products module's publish-readiness check
 * (Section 8.1's constraint) reads. Reservation-on-checkout logic
 * (Section 9.8's "Future Reservation Strategy") arrives with the
 * Cart/Checkout modules.
 */
export const inventory = pgTable(
  'inventory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    variantId: uuid('variant_id').notNull(),
    quantityAvailable: integer('quantity_available').notNull().default(0),
    quantityReserved: integer('quantity_reserved').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('inventory_variant_id_unique_idx').on(table.variantId),
    index('inventory_quantity_available_idx').on(table.quantityAvailable),
  ],
);
