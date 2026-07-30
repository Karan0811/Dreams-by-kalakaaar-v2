import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Categories domain — 08-database-design.md Section 10.
 *
 * SCOPE NOTE (backend/SCOPE.md): only `Category` itself is implemented here,
 * as the minimum taxonomy anchor the Products module's `productCategories`
 * join table requires. `Collection`, `Occasion`, `Festival`, `GiftGuide`,
 * `NavigationNode`, `Tag`, `Material`, `Technique` and the rest of the
 * Categories module are deferred to that module's own build phase.
 */

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull(),
    description: text('description'),
    parentId: uuid('parent_id'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('categories_slug_unique_idx').on(table.slug),
    index('categories_parent_id_idx').on(table.parentId),
  ],
);
