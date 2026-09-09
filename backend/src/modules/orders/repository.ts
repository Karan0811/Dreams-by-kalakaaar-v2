import { and, desc, eq, sql } from 'drizzle-orm';
import { db, withTransaction } from '@/shared/db/client';
import {
  orders,
  orderItems,
  orderStatusHistory,
  cartItems,
  productVariants,
  products,
  inventory,
  userAddresses,
} from '@/shared/db/schema';
import { EmptyCartError, CartItemStockChangedError, ShippingAddressNotFoundError } from './errors';
import type { ListMyOrdersQuery } from './schemas';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DK-${stamp}-${rand}`;
}

/**
 * The full checkout flow — read cart, validate every line still has
 * sufficient stock, create the Order + line items, decrement inventory,
 * record initial status history, and clear the cart — all inside one
 * transaction. Doing this in a single transaction (rather than reading the
 * cart in the Service Layer, then writing separately) is what prevents a
 * stock check from racing a concurrent purchase between the read and the
 * write; that's also why the stock-validation errors are thrown from here
 * rather than the Service Layer, an intentional, documented exception to
 * this codebase's usual "Repository returns, Service throws" split
 * (10-backend-architecture.md Section 9's own layering note already
 * allows this for atomicity-critical paths).
 */
export async function checkoutFromCart(userId: string, addressId: string) {
  return withTransaction(async (tx) => {
    const address = await findAddressForOrderTx(tx, userId, addressId);
    if (!address) throw new ShippingAddressNotFoundError();

    // FIX (duplicate-submission race): without a lock, two concurrent
    // checkout requests for the same user's cart (double-click,
    // double-submit, a client retry racing the original) can both read the
    // same non-empty cart before either commits, and both create an Order
    // + decrement inventory from it. A plain, single-table `FOR UPDATE`
    // lock on this user's `cartItems` rows makes the second request's
    // transaction wait for the first to finish; once the first commits
    // (deleting the cart), the second's own line-item query below simply
    // finds no rows and correctly falls through to `EmptyCartError`
    // instead of creating a duplicate Order. No new table/column, no
    // idempotency-key middleware — a minimal fix within the existing
    // single-transaction design. Deliberately a separate, single-table
    // query (not `.for('update')` on the joined `lines` query below) —
    // `inventory` is LEFT JOINed there, and Postgres rejects `FOR UPDATE`
    // on the nullable side of an outer join.
    const lockedCartItems = await tx
      .select({ id: cartItems.id })
      .from(cartItems)
      .where(eq(cartItems.userId, userId))
      .for('update');

    if (lockedCartItems.length === 0) throw new EmptyCartError();

    const lines = await tx
      .select({
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        variantStatus: productVariants.status,
        priceAmount: productVariants.priceAmount,
        priceCurrency: productVariants.priceCurrency,
        attributes: productVariants.attributes,
        productId: products.id,
        productTitle: products.title,
        productDeletedAt: products.deletedAt,
        storeId: products.storeId,
        quantityAvailable: inventory.quantityAvailable,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(eq(cartItems.userId, userId));

    if (lines.length === 0) throw new EmptyCartError();

    for (const line of lines) {
      const available = line.quantityAvailable ?? 0;
      // A soft-deleted product is unavailable exactly like an inactive
      // variant or insufficient stock — same rejection, same message
      // shape, so the buyer is told to revisit their cart rather than
      // having the line silently dropped and the total quietly change.
      if (line.productDeletedAt !== null || line.variantStatus !== 'ACTIVE' || line.quantity > available) {
        throw new CartItemStockChangedError(line.productTitle, available);
      }
    }

    const subtotalAmount = lines.reduce((sum, line) => sum + line.priceAmount * line.quantity, 0);

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        userId,
        status: 'PENDING',
        subtotalAmount,
        currency: lines[0]?.priceCurrency ?? 'INR',
        shippingAddressId: address.id,
        shippingRecipientName: address.recipientName,
        shippingRecipientPhone: address.recipientPhone,
        shippingLine1: address.line1,
        shippingLine2: address.line2,
        shippingCity: address.city,
        shippingState: address.state,
        shippingPostalCode: address.postalCode,
        shippingCountry: address.country,
      })
      .returning();
    if (!order) throw new Error('Failed to create order row.');

    for (const line of lines) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        storeId: line.storeId,
        productId: line.productId,
        variantId: line.variantId,
        titleSnapshot: line.productTitle,
        variantAttributesSnapshot: JSON.stringify(line.attributes),
        unitPriceAmount: line.priceAmount,
        quantity: line.quantity,
        lineTotalAmount: line.priceAmount * line.quantity,
      });

      await tx
        .update(inventory)
        .set({
          quantityAvailable: sql`greatest(${inventory.quantityAvailable} - ${line.quantity}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(inventory.variantId, line.variantId));
    }

    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      fromStatus: null,
      toStatus: 'PENDING',
      changedById: userId,
    });

    await tx.delete(cartItems).where(eq(cartItems.userId, userId));

    return order;
  });
}

async function findAddressForOrderTx(tx: Tx, userId: string, addressId: string) {
  const [row] = await tx
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function listOrdersForUser(userId: string, query: ListMyOrdersQuery) {
  const conditions = [eq(orders.userId, userId)];
  if (query.status) conditions.push(eq(orders.status, query.status));

  return db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(query.limit)
    .offset(query.offset);
}

export async function findOrderById(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;

  // These child collections are independent once the parent exists. Running
  // them together removes one database round-trip from every order detail
  // request without changing the response shape.
  const [items, history] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(orderStatusHistory.createdAt),
  ]);

  return { ...order, items, statusHistory: history };
}

export async function setOrderStatus(
  orderId: string,
  fromStatus: string,
  toStatus: string,
  changedById: string,
  note?: string,
) {
  return withTransaction(async (tx) => {
    const [updated] = await tx
      .update(orders)
      .set({
        status: toStatus as (typeof orders.status.enumValues)[number],
        ...(toStatus === 'CANCELLED' ? { cancelledAt: new Date(), cancellationReason: note } : {}),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
    if (!updated) return null;

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: fromStatus as (typeof orders.status.enumValues)[number],
      toStatus: toStatus as (typeof orders.status.enumValues)[number],
      changedById,
      note,
    });

    // Cancelling restocks every line item — the same signed-delta pattern
    // used everywhere else inventory is touched in this module.
    if (toStatus === 'CANCELLED') {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const item of items) {
        await tx
          .update(inventory)
          .set({ quantityAvailable: sql`${inventory.quantityAvailable} + ${item.quantity}`, updatedAt: new Date() })
          .where(eq(inventory.variantId, item.variantId));
      }
    }

    return updated;
  });
}
