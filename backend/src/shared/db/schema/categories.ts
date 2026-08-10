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
import { relations } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

/**
 * Categories domain — 08-database-design.md Section 10.
 *
 * SCOPE NOTE (backend/SCOPE.md, updated Sprint 02): `Category` doubles as
 * both top-level Category and Subcategory via the self-referencing
 * `parentId` — a `NULL` parent is a top-level Category, a non-null parent
 * is a Subcategory of it. The Sprint 02 brief's "Subcategory CRUD" reuses
 * this same table/module rather than introducing a parallel
 * `subcategories` table, since the schema already modeled subcategories
 * this way from Sprint 01 (this file's `parentId` column existed before
 * Sprint 02; it simply had no `.references()` FK constraint or module
 * built on top of it yet). `Collection`, `Occasion`, `Festival`,
 * `GiftGuide`, `NavigationNode`, `Tag`, `Material`, `Technique` remain
 * deferred, documented in 08-database-design.md Sections 10.2–10.9.
 */

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull(),
    description: text('description'),
    /** NULL = top-level Category. Non-null = a Subcategory of that parent. Self-FK typed via AnyPgColumn (Drizzle's documented pattern for same-table references). */
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'restrict',
    }),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    /** Sprint 02 — soft delete, matching the `products.deletedAt` convention (`product.ts`). */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('categories_slug_unique_idx').on(table.slug),
    index('categories_parent_id_idx').on(table.parentId),
    index('categories_deleted_at_idx').on(table.deletedAt),
  ],
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  subcategories: many(categories),
}));
