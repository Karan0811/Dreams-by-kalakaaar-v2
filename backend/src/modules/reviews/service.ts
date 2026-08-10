import * as reviewsRepository from './repository';
import { ReviewAlreadyExistsError, ReviewNotFoundError } from './errors';
import { ProductNotFoundError } from '@/modules/products/errors';
import * as productsRepository from '@/modules/products/repository';
import * as productsService from '@/modules/products/service';
import * as notificationsService from '@/modules/notifications/service';
import type { CreateReviewInput, ListProductReviewsQuery, UpdateReviewInput } from './schemas';

export async function listProductReviews(productId: string, query: ListProductReviewsQuery) {
  return reviewsRepository.listReviewsForProduct(productId, query);
}

export async function createReview(userId: string, input: CreateReviewInput) {
  const product = await productsRepository.findProductById(input.productId);
  if (!product) throw new ProductNotFoundError();

  const existing = await reviewsRepository.findReviewByUserAndProduct(userId, input.productId);
  if (existing) throw new ReviewAlreadyExistsError();

  const verifiedOrderItem = await reviewsRepository.findVerifiedOrderItem(userId, input.productId);
  const review = await reviewsRepository.createReview(userId, input, verifiedOrderItem?.id ?? null);

  await reviewsRepository.recalculateProductRatingStats(input.productId);

  const storeOwnerUserId = await productsService.getStoreOwnerUserId(product.storeId);
  if (storeOwnerUserId) {
    await notificationsService.notify({
      userId: storeOwnerUserId,
      type: 'PRODUCT_REVIEW_RECEIVED',
      title: 'New review received',
      body: `Your product "${product.title}" received a new ${input.rating}-star review.`,
      data: { productId: input.productId, reviewId: review.id },
    });
  }

  return review;
}

async function requireOwnReview(reviewId: string, userId: string) {
  const review = await reviewsRepository.findReviewById(reviewId);
  if (!review || review.userId !== userId) throw new ReviewNotFoundError();
  return review;
}

export async function updateMyReview(userId: string, reviewId: string, input: UpdateReviewInput) {
  await requireOwnReview(reviewId, userId);

  const updated = await reviewsRepository.updateReview(reviewId, userId, input);
  if (!updated) throw new ReviewNotFoundError();

  await reviewsRepository.recalculateProductRatingStats(updated.productId);
  return updated;
}

export async function deleteMyReview(userId: string, reviewId: string) {
  const review = await requireOwnReview(reviewId, userId);

  const deleted = await reviewsRepository.deleteReview(reviewId, userId);
  if (!deleted) throw new ReviewNotFoundError();

  await reviewsRepository.recalculateProductRatingStats(review.productId);
  return deleted;
}

/** Admin moderation — requires `reviews:moderate` (enforced at the route layer). */
export async function moderateDeleteReview(reviewId: string) {
  const review = await reviewsRepository.findReviewById(reviewId);
  if (!review) throw new ReviewNotFoundError();

  const deleted = await reviewsRepository.deleteReviewAsModerator(reviewId);
  if (!deleted) throw new ReviewNotFoundError();

  await reviewsRepository.recalculateProductRatingStats(review.productId);
  return deleted;
}
