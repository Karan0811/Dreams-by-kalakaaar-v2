import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { wishlistItems, products } from '@/shared/db/schema';

export async function listWishlistItems(userId: string) {
  return db
    .select({
      id: wishlistItems.id,
      productId: wishlistItems.productId,
      createdAt: wishlistItems.createdAt,
      product: {
        id: products.id,
        title: products.title,
        slug: products.slug,
        status: products.status,
      },
    })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt));
}

export async function findWishlistItem(userId: string, productId: string) {
  const [row] = await db
    .select()
    .from(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
    .limit(1);
  return row ?? null;
}

export async function addWishlistItem(userId: string, productId: string) {
  const [row] = await db.insert(wishlistItems).values({ userId, productId }).returning();
  if (!row) throw new Error('Failed to create wishlist item row.');
  return row;
}

export async function removeWishlistItem(userId: string, productId: string) {
  const [row] = await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
    .returning();
  return row ?? null;
}

export async function findProductById(productId: string) {
  const [row] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return row ?? null;
}

/** Atomically adjusts `products.wishlistCount` — same signed-delta, single-UPDATE pattern as `modules/products/repository.ts`'s `adjustVariantInventory`, to avoid a read-then-write race. */
export async function adjustWishlistCount(productId: string, delta: 1 | -1) {
  await db
    .update(products)
    .set({ wishlistCount: sql`greatest(${products.wishlistCount} + ${delta}, 0)` })
    .where(eq(products.id, productId));
}
