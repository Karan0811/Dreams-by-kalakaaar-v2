import { and, eq } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { cartItems, productVariants, products, inventory } from '@/shared/db/schema';

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
    .where(eq(cartItems.userId, userId));
}

export async function findCartItem(userId: string, variantId: string) {
  const [row] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)))
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

export async function findVariantWithInventory(variantId: string) {
  const [row] = await db
    .select({
      variant: productVariants,
      quantityAvailable: inventory.quantityAvailable,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(productVariants.id, variantId))
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
