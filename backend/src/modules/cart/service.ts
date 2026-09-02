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

function assertVariantAvailable<T extends { variant: { status: string }; quantityAvailable: number | null }>(
  row: T | null,
  requestedQuantity: number,
): T {
  if (!row || row.variant.status !== 'ACTIVE') throw new ProductVariantNotAvailableError();

  const available = row.quantityAvailable ?? 0;
  if (requestedQuantity > available) throw new InsufficientStockError(available);
  return row;
}

export async function addToMyCart(userId: string, variantId: string, quantity: number) {
  const row = await cartRepository.findCartItemWithVariantAndInventory(userId, variantId);
  const newQuantity = (row?.cartItem?.quantity ?? 0) + quantity;
  const availableRow = assertVariantAvailable(row, newQuantity);

  const existing = availableRow.cartItem;
  let item: Awaited<ReturnType<typeof cartRepository.insertCartItem>>;
  if (existing) {
    const updated = await cartRepository.updateCartItemQuantityById(userId, existing.id, newQuantity);
    if (!updated) throw new CartItemNotFoundError();
    item = updated;
  } else {
    item = await cartRepository.insertCartItem(userId, variantId, quantity);
  }

  // Return the complete cart entry from the already-loaded join. This lets
  // the browser reconcile its React Query cache without a follow-up GET.
  return {
    ...item,
    variant: {
      id: availableRow.variant.id,
      productId: availableRow.variant.productId,
      attributes: availableRow.variant.attributes,
      priceAmount: availableRow.variant.priceAmount,
      priceCurrency: availableRow.variant.priceCurrency,
      status: availableRow.variant.status,
    },
    product: {
      id: availableRow.product.id,
      title: availableRow.product.title,
      slug: availableRow.product.slug,
      status: availableRow.product.status,
    },
    quantityAvailable: availableRow.quantityAvailable,
  };
}

export async function updateMyCartItemQuantity(userId: string, cartItemId: string, quantity: number) {
  const existing = await cartRepository.findCartItemById(userId, cartItemId);
  if (!existing) throw new CartItemNotFoundError();

  const available = await cartRepository.findVariantWithInventory(existing.variantId);
  assertVariantAvailable(available, quantity);

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
