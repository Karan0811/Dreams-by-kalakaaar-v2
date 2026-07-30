import { and, desc, eq, lt, or, sql } from 'drizzle-orm';
import { db, withTransaction } from '@/shared/db/client';
import { inventory, productMedia, productVariants, products, stores } from '@/shared/db/schema';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './schemas';

/** Products module Repository Layer — 08-database-design.md Section 8. */

export async function findStoreById(storeId: string) {
  const [row] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  return row ?? null;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createProduct(storeId: string, input: CreateProductInput) {
  return withTransaction(async (tx) => {
    const baseSlug = slugify(input.title);
    const uniqueSuffix = Math.random().toString(36).slice(2, 8);

    const [product] = await tx
      .insert(products)
      .values({
        storeId,
        title: input.title,
        slug: `${baseSlug}-${uniqueSuffix}`,
        description: input.description,
        productType: input.productType,
        leadTimeDays: input.leadTimeDays,
        primaryCategoryId: input.primaryCategoryId,
        status: 'DRAFT',
      })
      .returning();

    if (!product) throw new Error('Failed to create Product row.');

    for (const variantInput of input.variants) {
      const [variant] = await tx
        .insert(productVariants)
        .values({
          productId: product.id,
          attributes: variantInput.attributes,
          priceAmount: variantInput.priceAmount,
          priceCurrency: variantInput.priceCurrency,
          skuReference: variantInput.skuReference,
        })
        .returning();

      if (!variant) throw new Error('Failed to create ProductVariant row.');

      await tx.insert(inventory).values({
        variantId: variant.id,
        quantityAvailable: variantInput.initialQuantity,
      });
    }

    return product;
  });
}

export async function findProductById(productId: string) {
  const [row] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return row ?? null;
}

export async function findPublicProductByIdOrSlug(idOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const [row] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'ACTIVE'),
        isUuid ? eq(products.id, idOrSlug) : eq(products.slug, idOrSlug),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function findVariantsForProduct(productId: string) {
  return db
    .select({
      id: productVariants.id,
      attributes: productVariants.attributes,
      priceAmount: productVariants.priceAmount,
      priceCurrency: productVariants.priceCurrency,
      skuReference: productVariants.skuReference,
      status: productVariants.status,
      quantityAvailable: inventory.quantityAvailable,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
    .where(eq(productVariants.productId, productId));
}

export async function findMediaForProduct(productId: string) {
  return db
    .select()
    .from(productMedia)
    .where(eq(productMedia.productId, productId))
    .orderBy(productMedia.displayOrder);
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  const [updated] = await db
    .update(products)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(products.id, productId))
    .returning();
  return updated ?? null;
}

export async function updateProductStatus(productId: string, status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
  const [updated] = await db
    .update(products)
    .set({
      status,
      updatedAt: new Date(),
      archivedAt: status === 'ARCHIVED' ? new Date() : null,
    })
    .where(eq(products.id, productId))
    .returning();
  return updated ?? null;
}

export interface Cursor {
  createdAt: Date;
  id: string;
}

function encodeCursor(row: { createdAt: Date; id: string }): string {
  return Buffer.from(`${row.createdAt.toISOString()}|${row.id}`).toString('base64url');
}

function decodeCursor(cursor: string): Cursor {
  const [createdAtIso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
  return { createdAt: new Date(createdAtIso ?? ''), id: id ?? '' };
}

/** Creator-side listing: every status, scoped to one Store. */
export async function listProductsForStore(storeId: string, query: ListProductsQuery) {
  const cursorFilter = query.cursor ? decodeCursor(query.cursor) : null;

  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        cursorFilter
          ? or(
              lt(products.createdAt, cursorFilter.createdAt),
              and(eq(products.createdAt, cursorFilter.createdAt), lt(products.id, cursorFilter.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(query.limit + 1);

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const lastRow = page.at(-1);

  return {
    data: page,
    nextCursor: hasMore && lastRow ? encodeCursor(lastRow) : null,
    hasMore,
  };
}

/** Public listing: ACTIVE only, optionally filtered by category/store. */
export async function listPublicProducts(query: ListProductsQuery) {
  const cursorFilter = query.cursor ? decodeCursor(query.cursor) : null;

  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'ACTIVE'),
        query.storeId ? eq(products.storeId, query.storeId) : undefined,
        query.categoryId ? eq(products.primaryCategoryId, query.categoryId) : undefined,
        cursorFilter
          ? or(
              lt(products.createdAt, cursorFilter.createdAt),
              and(eq(products.createdAt, cursorFilter.createdAt), lt(products.id, cursorFilter.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(query.limit + 1);

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const lastRow = page.at(-1);

  return {
    data: page,
    nextCursor: hasMore && lastRow ? encodeCursor(lastRow) : null,
    hasMore,
  };
}

export async function countVariantsMissingInventory(productId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productVariants)
    .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
    .where(and(eq(productVariants.productId, productId), sql`${inventory.id} IS NULL`));

  return row?.count ?? 0;
}

export async function countMediaForProduct(productId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productMedia)
    .where(eq(productMedia.productId, productId));

  return row?.count ?? 0;
}
