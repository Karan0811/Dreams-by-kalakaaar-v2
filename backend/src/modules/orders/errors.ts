import { NotFoundError, PaymentError, ValidationError } from '@/shared/errors/base-errors';

export class OrderNotFoundError extends NotFoundError {
  constructor() {
    super('Order not found.');
  }
}

/** FIX: checkoutFromCart previously threw a plain `Error` for this, which `error-handler.ts` has no choice but to map to a generic 500 — masking a legitimate 404 (bad or foreign shippingAddressId) as a server fault. */
export class ShippingAddressNotFoundError extends NotFoundError {
  constructor() {
    super('Shipping address not found.');
  }
}

export class EmptyCartError extends ValidationError {
  constructor() {
    super('Your cart is empty. Add items before placing an order.', undefined, 422);
  }
}

export class OrderNotCancellableError extends ValidationError {
  constructor(status: string) {
    super(`An order in "${status}" status can no longer be cancelled.`, undefined, 422);
  }
}

export class InvalidOrderStatusTransitionError extends ValidationError {
  constructor(from: string, to: string) {
    super(`Cannot transition Order status from ${from} to ${to}.`, undefined, 422);
  }
}

export class CartItemStockChangedError extends ValidationError {
  constructor(productTitle: string, available: number) {
    super(
      `"${productTitle}" no longer has enough stock (only ${available} available). Update your cart and try again.`,
      undefined,
      422,
    );
  }
}

/**
 * Reserved for the real payment integration (Razorpay, Sprint 03+): once a
 * payment step exists, an order will need to stay blocked here until that
 * payment is created and verified. Not thrown anywhere today — Sprint 02
 * creates Orders directly in `PENDING` with no payment step at all (see
 * `shared/db/schema/orders.ts`'s doc comment), which `createOrder`
 * (service.ts) does unconditionally rather than gating on this error.
 */
export class CheckoutPaymentUnavailableError extends PaymentError {
  override readonly code = 'CHECKOUT_PAYMENT_UNAVAILABLE';

  constructor() {
    super('Order placement is temporarily unavailable while secure payment processing is being set up.');
  }
}
