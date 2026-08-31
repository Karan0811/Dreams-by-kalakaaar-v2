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
 * Final checkout must remain unavailable until a payment provider can create
 * and verify a payment before inventory and order records are committed.
 */
export class CheckoutPaymentUnavailableError extends PaymentError {
  override readonly code = 'CHECKOUT_PAYMENT_UNAVAILABLE';

  constructor() {
    super('Order placement is temporarily unavailable while secure payment processing is being set up.');
  }
}
