import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { reviews, products, userProfiles, orderItems, orders } from '@/shared/db/schema';
import type { CreateReviewInput, ListProductReviewsQuery, UpdateReviewInput } from './schemas';

export async function listReviewsForProduct(productId: string, query: ListProductReviewsQuery) {
  return db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      userId: reviews.userId,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      isVerifiedPurchase: sql<boolean>`(${reviews.orderItemId} is not null)`,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      authorDisplayName: userProfiles.displayName,
    })
    .from(reviews)
    .innerJoin(userProfiles, eq(userProfiles.userId, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(query.limit)
    .offset(query.offset);
}

export async function findReviewById(reviewId: string) {
  const [row] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  return row ?? null;
}

export async function findReviewByUserAndProduct(userId: string, productId: string) {
  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1);
  return row ?? null;
}

/** A DELIVERED order item for this user+product proves a verified purchase. */
export async function findVerifiedOrderItem(userId: string, productId: string) {
  const [row] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(eq(orders.userId, userId), eq(orderItems.productId, productId), eq(orders.status, 'DELIVERED')),
    )
    .limit(1);
  return row ?? null;
}

export async function createReview(userId: string, input: CreateReviewInput, orderItemId: string | null) {
  const [row] = await db
    .insert(reviews)
    .values({
      productId: input.productId,
      userId,
      orderItemId,
      rating: input.rating,
      title: input.title,
      body: input.body,
    })
    .returning();
  if (!row) throw new Error('Failed to create review row.');
  return row;
}

export async function updateReview(reviewId: string, userId: string, input: UpdateReviewInput) {
  const [row] = await db
    .update(reviews)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteReview(reviewId: string, userId: string) {
  const [row] = await db
    .delete(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
    .returning();
  return row ?? null;
}

/** Admin moderation delete — no ownership check (route layer enforces `reviews:moderate`). */
export async function deleteReviewAsModerator(reviewId: string) {
  const [row] = await db.delete(reviews).where(eq(reviews.id, reviewId)).returning();
  return row ?? null;
}

/**
 * Recomputes `products.averageRating`/`reviewCount` from the actual
 * `reviews` rows — a full recompute rather than an incremental
 * signed-delta (like `wishlistCount`/inventory use) because an average
 * isn't a running sum: an edited rating changes the average in a way a
 * simple +/-1 delta can't express correctly. `products.averageRating` is
 * an `integer` column (not decimal), so the average is rounded to the
 * nearest whole star — a documented Sprint 02 assumption; a fractional
 * average (e.g. 4.3) would need a schema change this sprint's brief
 * didn't ask for.
 */
export async function recalculateProductRatingStats(productId: string) {
  const [stats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      average: sql<number>`round(coalesce(avg(${reviews.rating}), 0))::int`,
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  await db
    .update(products)
    .set({
      reviewCount: stats?.count ?? 0,
      averageRating: stats?.average ?? 0,
    })
    .where(eq(products.id, productId));
}
