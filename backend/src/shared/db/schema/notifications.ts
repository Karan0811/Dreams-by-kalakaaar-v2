import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './identity';

/**
 * Notifications domain — Sprint 02 (Marketplace Foundation).
 *
 * In-app notifications only (no email/push fan-out — that's
 * `shared/email`'s existing Resend client for auth flows, out of scope to
 * extend this sprint). `type` is a coarse category the frontend uses to
 * pick an icon/route; `data` carries the type-specific payload (e.g.
 * `{ orderId }` for an `ORDER_STATUS_CHANGED` notification) without this
 * schema needing a column per notification type.
 */
export const notificationTypeEnum = pgEnum('notification_type', [
  'ORDER_STATUS_CHANGED',
  'ORDER_CANCELLED',
  'PRODUCT_REVIEW_RECEIVED',
  'CREATOR_APPLICATION_STATUS',
  'CREATOR_DOCUMENT_REVIEWED',
  'LOW_STOCK_ALERT',
  'GENERAL',
]);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull().default('GENERAL'),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>(),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_user_is_read_idx').on(table.userId, table.isRead),
    index('notifications_created_at_idx').on(table.createdAt),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
