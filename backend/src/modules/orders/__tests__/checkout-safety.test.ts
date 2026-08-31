import { describe, expect, it, vi } from 'vitest';
import { CheckoutPaymentUnavailableError } from '../errors';

const checkoutFromCart = vi.fn();

vi.mock('../repository', () => ({ checkoutFromCart }));
vi.mock('@/modules/notifications/service', () => ({ notify: vi.fn() }));

describe('checkout safety', () => {
  it('returns an explicit payment error while secure payment capture is unavailable', () => {
    const error = new CheckoutPaymentUnavailableError();

    expect(error.code).toBe('CHECKOUT_PAYMENT_UNAVAILABLE');
    expect(error.httpStatus).toBe(402);
  });

  it('does not create an order or alter inventory before a payment integration exists', async () => {
    const { createOrder } = await import('../service');

    await expect(createOrder('user-id', 'address-id')).rejects.toMatchObject({
      code: 'CHECKOUT_PAYMENT_UNAVAILABLE',
      httpStatus: 402,
    });
    expect(checkoutFromCart).not.toHaveBeenCalled();
  });
});
