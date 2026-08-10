import * as wishlistRepository from './repository';
import { WishlistItemAlreadyExistsError, WishlistItemNotFoundError } from './errors';
import { ProductNotFoundError } from '@/modules/products/errors';

export async function listMyWishlist(userId: string) {
  return wishlistRepository.listWishlistItems(userId);
}

export async function addToMyWishlist(userId: string, productId: string) {
  const product = await wishlistRepository.findProductById(productId);
  if (!product) throw new ProductNotFoundError();

  const existing = await wishlistRepository.findWishlistItem(userId, productId);
  if (existing) throw new WishlistItemAlreadyExistsError();

  const item = await wishlistRepository.addWishlistItem(userId, productId);
  await wishlistRepository.adjustWishlistCount(productId, 1);
  return item;
}

export async function removeFromMyWishlist(userId: string, productId: string) {
  const removed = await wishlistRepository.removeWishlistItem(userId, productId);
  if (!removed) throw new WishlistItemNotFoundError();
  await wishlistRepository.adjustWishlistCount(productId, -1);
  return removed;
}
