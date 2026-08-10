import * as cartRepository from './repository';
import { CartItemNotFoundError, InsufficientStockError, ProductVariantNotAvailableError } from './errors';

export async function getMyCart(userId: string) {
  const items = await cartRepository.listCartItems(userId);
  const subtotalAmount = items.reduce((sum, item) => sum + item.variant.priceAmount * item.quantity, 0);
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalAmount,
    currency: items[0]?.variant.priceCurrency ?? 'INR',
  };
}

async function assertVariantAvailable(variantId: string, requestedQuantity: number) {
  const row = await cartRepository.findVariantWithInventory(variantId);
  if (!row || row.variant.status !== 'ACTIVE') throw new ProductVariantNotAvailableError();

  const available = row.quantityAvailable ?? 0;
  if (requestedQuantity > available) throw new InsufficientStockError(available);

  return row.variant;
}

export async function addToMyCart(userId: string, variantId: string, quantity: number) {
  const existing = await cartRepository.findCartItem(userId, variantId);
  const newQuantity = (existing?.quantity ?? 0) + quantity;

  await assertVariantAvailable(variantId, newQuantity);

  if (existing) {
    const updated = await cartRepository.updateCartItemQuantityById(userId, existing.id, newQuantity);
    if (!updated) throw new CartItemNotFoundError();
    return updated;
  }

  return cartRepository.insertCartItem(userId, variantId, quantity);
}

export async function updateMyCartItemQuantity(userId: string, cartItemId: string, quantity: number) {
  const existing = await cartRepository.findCartItemById(userId, cartItemId);
  if (!existing) throw new CartItemNotFoundError();

  await assertVariantAvailable(existing.variantId, quantity);

  const updated = await cartRepository.updateCartItemQuantityById(userId, cartItemId, quantity);
  if (!updated) throw new CartItemNotFoundError();
  return updated;
}

export async function removeFromMyCart(userId: string, cartItemId: string) {
  const deleted = await cartRepository.deleteCartItemById(userId, cartItemId);
  if (!deleted) throw new CartItemNotFoundError();
  return deleted;
}

/** Used by the Orders module immediately after a successful order creation. */
export async function clearMyCart(userId: string) {
  await cartRepository.clearCart(userId);
}
