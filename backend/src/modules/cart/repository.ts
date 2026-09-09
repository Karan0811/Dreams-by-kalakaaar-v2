import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { cartItems, productVariants, products, inventory } from '@/shared/db/schema';

// Same convention as `products/repository.ts`'s `notDeleted` /
// `wishlist/repository.ts`'s fix: a soft-deleted product must disappear
// from everywhere it's read from, cart included.
const notDeleted = isNull(products.deletedAt);

export async function listCartItems(userId: string) {
  return db
    .select({
      id: cartItems.id,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      createdAt: cartItems.createdAt,
      updatedAt: cartItems.updatedAt,
      variant: {
        id: productVariants.id,
        productId: productVariants.productId,
        attributes: productVariants.attributes,
        priceAmount: productVariants.priceAmount,
        priceCurrency: productVariants.priceCurrency,
        status: productVariants.status,
      },
      product: {
        id: products.id,
        title: products.title,
        slug: products.slug,
        status: products.status,
      },
      quantityAvailable: inventory.quantityAvailable,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    // FIX: previously joined without excluding soft-deleted products, so a
    // deleted product's variant could sit in a buyer's cart forever instead
    // of disappearing like it does everywhere else it's read from.
    .where(and(eq(cartItems.userId, userId), notDeleted));
}

/**
 * Loads the cart line and the purchasable variant in one round trip. The
 * previous add flow did a cart lookup and then a second variant/inventory
 * lookup before every write.
 */
export async function findCartItemWithVariantAndInventory(userId: string, variantId: string) {
  const [row] = await db
    .select({
      cartItem: cartItems,
      variant: productVariants,
      product: products,
      quantityAvailable: inventory.quantityAvailable,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .leftJoin(
      cartItems,
      and(eq(cartItems.userId, userId), eq(cartItems.variantId, productVariants.id)),
    )
    .where(and(eq(productVariants.id, variantId), notDeleted))
    .limit(1);
  return row ?? null;
}

export async function findCartItemById(userId: string, cartItemId: string) {
  const [row] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
    .limit(1);
  return row ?? null;
}

/** Same single-round-trip read as the add path, keyed by the cart line for
 * quantity updates. This replaces a cart-line lookup followed by a separate
 * variant/inventory lookup. */
export async function findCartItemWithVariantAndInventoryById(userId: string, cartItemId: string) {
  const [row] = await db
    .select({
      cartItem: cartItems,
      variant: productVariants,
      product: products,
      quantityAvailable: inventory.quantityAvailable,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(and(eq(cartItems.userId, userId), eq(cartItems.id, cartItemId), notDeleted))
    .limit(1);
  return row ?? null;
}

export async function findVariantWithInventory(variantId: string) {
  const [row] = await db
    .select({
      variant: productVariants,
      quantityAvailable: inventory.quantityAvailable,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    // FIX: previously didn't join `products` at all, so `assertVariantAvailable`
    // (service.ts) could let a buyer add/update a quantity against a variant
    // whose parent product was soft-deleted — the same gap fixed for reads
    // above, but on the write path this time.
    .where(and(eq(productVariants.id, variantId), notDeleted))
    .limit(1);
  return row ?? null;
}

export async function insertCartItem(userId: string, variantId: string, quantity: number) {
  const [row] = await db.insert(cartItems).values({ userId, variantId, quantity }).returning();
  if (!row) throw new Error('Failed to create cart item row.');
  return row;
}

export async function updateCartItemQuantityById(userId: string, cartItemId: string, quantity: number) {
  const [row] = await db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteCartItemById(userId: string, cartItemId: string) {
  const [row] = await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
    .returning();
  return row ?? null;
}

export async function clearCart(userId: string) {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}
