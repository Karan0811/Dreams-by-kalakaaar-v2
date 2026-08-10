import { and, eq, isNull, count } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { categories, productCategories } from '@/shared/db/schema';
import type { CreateCategoryInput, ListCategoriesQuery, UpdateCategoryInput } from './schemas';

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function findCategoryBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), isNull(categories.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function findCategoryById(categoryId: string) {
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function listCategories(query: ListCategoriesQuery) {
  if (query.flat) {
    return db
      .select()
      .from(categories)
      .where(isNull(categories.deletedAt))
      .orderBy(categories.displayOrder);
  }

  return db
    .select()
    .from(categories)
    .where(
      and(
        isNull(categories.deletedAt),
        query.parentId ? eq(categories.parentId, query.parentId) : isNull(categories.parentId),
      ),
    )
    .orderBy(categories.displayOrder);
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = input.slug ?? slugify(input.name);
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      slug,
      description: input.description,
      parentId: input.parentId ?? null,
      displayOrder: input.displayOrder,
    })
    .returning();
  if (!row) throw new Error('Failed to create Category row.');
  return row;
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const [row] = await db
    .update(categories)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .returning();
  return row ?? null;
}

export async function updateCategoryParent(categoryId: string, parentId: string | null) {
  const [row] = await db
    .update(categories)
    .set({ parentId, updatedAt: new Date() })
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .returning();
  return row ?? null;
}

export async function countSubcategories(categoryId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(categories)
    .where(and(eq(categories.parentId, categoryId), isNull(categories.deletedAt)));
  return row?.count ?? 0;
}

export async function countProductsInCategory(categoryId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(productCategories)
    .where(eq(productCategories.categoryId, categoryId));
  return row?.count ?? 0;
}

export async function softDeleteCategory(categoryId: string) {
  const [row] = await db
    .update(categories)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .returning();
  return row ?? null;
}
