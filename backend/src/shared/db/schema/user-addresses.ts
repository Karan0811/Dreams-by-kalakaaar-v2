import { boolean, index, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './identity';

/**
 * User Addresses domain — Sprint 02 (Marketplace Foundation).
 *
 * Buyer-facing shipping/billing addresses, distinct from
 * `marketplace.ts`'s `creatorAddresses` (a Creator's business
 * registered/warehouse address). Same shape convention as
 * `creatorAddresses` for consistency, plus a `label` field since a buyer
 * addresses multiple named locations ("Home", "Office") rather than
 * addresses distinguished by business function.
 */

export const addressTypeEnum = pgEnum('user_address_type', ['SHIPPING', 'BILLING']);

export const userAddresses = pgTable(
  'user_addresses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 64 }).notNull().default('Home'),
    type: addressTypeEnum('type').notNull().default('SHIPPING'),
    recipientName: varchar('recipient_name', { length: 255 }).notNull(),
    recipientPhone: varchar('recipient_phone', { length: 32 }).notNull(),
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
    index('user_addresses_user_id_idx').on(table.userId),
    index('user_addresses_user_default_idx').on(table.userId, table.isDefault),
  ],
);

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, { fields: [userAddresses.userId], references: [users.id] }),
}));
