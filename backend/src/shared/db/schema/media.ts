import { index, integer, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './identity';

/**
 * Media domain — 08-database-design.md Section 22.
 *
 * SCOPE NOTE (backend/SCOPE.md): the full Media module (processing pipeline,
 * variants, moderation) is 10-backend-architecture.md Section 11's scope. This
 * phase implements only the durable reference row every other module's
 * media foreign keys point at, backed by Cloudflare R2
 * (`shared/storage/r2-client.ts`).
 */

export const mediaTypeEnum = pgEnum('media_type', ['IMAGE', 'VIDEO', 'DOCUMENT']);
export const mediaStatusEnum = pgEnum('media_status', [
  'PENDING_UPLOAD',
  'PROCESSING',
  'READY',
  'FAILED',
  'REJECTED',
]);

export const media = pgTable(
  'media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    uploadedById: uuid('uploaded_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    type: mediaTypeEnum('type').notNull(),
    status: mediaStatusEnum('status').notNull().default('PENDING_UPLOAD'),
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    publicUrl: varchar('public_url', { length: 1024 }),
    mimeType: varchar('mime_type', { length: 128 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    altText: varchar('alt_text', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('media_uploaded_by_idx').on(table.uploadedById),
    index('media_status_idx').on(table.status),
  ],
);
