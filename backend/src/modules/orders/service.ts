import * as ordersRepository from './repository';
import { OrderNotFoundError, OrderNotCancellableError, InvalidOrderStatusTransitionError } from './errors';
import * as notificationsService from '@/modules/notifications/service';
import type { ListMyOrdersQuery } from './schemas';

/**
 * Sprint 02 checkout — no payment integration yet (explicit brief
 * constraint, documented on `shared/db/schema/orders.ts`'s `orders` table):
 * an Order is created directly in `PENDING` with no payment/authorization
 * step. `checkoutFromCart` (repository.ts) already implements the full,
 * atomic, server-validated flow — re-reads the cart, re-validates stock,
 * fetches authoritative prices from `productVariants`, computes totals,
 * and clears the cart, all inside one transaction. This was previously
 * gated behind an unconditional `CheckoutPaymentUnavailableError` stub;
 * that gate is removed here now that "PENDING, no payment" is the actual
 * target behavior for this sprint, not a future one.
 *
 * No "order placed" notification is sent here: `notificationTypeEnum`
 * (`shared/db/schema/notifications.ts`) has no matching value today, and
 * adding one is an out-of-scope schema change for this phase — the order
 * confirmation itself is the response returned to the caller (and the
 * page it's rendered on), not a notification.
 */
export async function createOrder(userId: string, shippingAddressId: string) {
  return ordersRepository.checkoutFromCart(userId, shippingAddressId);
}

export async function listMyOrders(userId: string, query: ListMyOrdersQuery) {
  return ordersRepository.listOrdersForUser(userId, query);
}

async function getOrderOwnedByOrThrow(userId: string, orderId: string) {
  const order = await ordersRepository.findOrderById(orderId);
  if (!order || order.userId !== userId) throw new OrderNotFoundError();
  return order;
}

export async function getMyOrder(userId: string, orderId: string) {
  return getOrderOwnedByOrThrow(userId, orderId);
}

/** Admin — any order, no ownership check (route layer enforces `orders:manage`). */
export async function getOrderById(orderId: string) {
  const order = await ordersRepository.findOrderById(orderId);
  if (!order) throw new OrderNotFoundError();
  return order;
}

const CANCELLABLE_STATUSES = new Set(['PENDING', 'CONFIRMED']);

export async function cancelMyOrder(userId: string, orderId: string, reason?: string) {
  const order = await getOrderOwnedByOrThrow(userId, orderId);
  if (!CANCELLABLE_STATUSES.has(order.status)) throw new OrderNotCancellableError(order.status);

  const updated = await ordersRepository.setOrderStatus(orderId, order.status, 'CANCELLED', userId, reason);
  if (!updated) throw new OrderNotFoundError();

  await notificationsService.notify({
    userId,
    type: 'ORDER_CANCELLED',
    title: 'Order cancelled',
    body: `Your order ${order.orderNumber} has been cancelled.`,
    data: { orderId },
  });

  return updated;
}

/**
 * Admin-only forward status transitions. `08-database-design.md` has no
 * Orders state-machine spec (see `shared/db/schema/orders.ts`'s doc
 * comment), so this is the documented Sprint 02 assumption: a strictly
 * linear PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
 * pipeline, with CANCELLED reachable from any non-terminal state.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export async function transitionOrderStatus(
  orderId: string,
  adminUserId: string,
  toStatus: string,
  note?: string,
) {
  const order = await ordersRepository.findOrderById(orderId);
  if (!order) throw new OrderNotFoundError();

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new InvalidOrderStatusTransitionError(order.status, toStatus);
  }

  const updated = await ordersRepository.setOrderStatus(orderId, order.status, toStatus, adminUserId, note);
  if (!updated) throw new OrderNotFoundError();

  await notificationsService.notify({
    userId: order.userId,
    type: toStatus === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED',
    title: `Order ${order.orderNumber} updated`,
    body: `Your order status changed to ${toStatus}.`,
    data: { orderId, status: toStatus },
  });

  return updated;
}
