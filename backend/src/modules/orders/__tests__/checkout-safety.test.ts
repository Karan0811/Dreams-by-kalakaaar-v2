import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EmptyCartError, CartItemStockChangedError, ShippingAddressNotFoundError } from '../errors';

const checkoutFromCart = vi.fn();

vi.mock('../repository', () => ({ checkoutFromCart }));
vi.mock('@/modules/notifications/service', () => ({ notify: vi.fn() }));

/**
 * Sprint 02 Phase 2 — `createOrder` (service.ts) is now a thin pass-through
 * to `checkoutFromCart` (repository.ts), which does the real, atomic,
 * server-side work: re-reading the cart, re-validating stock/availability,
 * pricing every line from `productVariants` (never from the client), and
 * computing the total. `checkoutFromCart` itself needs a live Postgres
 * database to exercise for real (transactions, row locks, joins) — that is
 * NOT re-implemented with a fake/in-memory DB here, since no other module
 * in this codebase does that either (see every other module's
 * `__tests__/schemas.test.ts` — schema-level only) and this sandbox has no
 * live database to validate a hand-rolled fake against. What IS verified
 * here is the one thing actually testable without a DB: that the Service
 * Layer wires the authenticated `userId` straight through to the
 * repository call and does not swallow or reshape whatever the repository
 * decides (success or error) — i.e. `createOrder` cannot be tricked into
 * returning something other than exactly what the real, validated
 * transaction produced. The repository-level behaviors (empty cart,
 * price/stock re-validation, deleted-product rejection, the
 * duplicate-submission row lock) are covered instead by the manual test
 * checklist in `docs/testing/MVP_USER_TESTING.md` — run those against a
 * real database before shipping this phase.
 */
describe('createOrder — service-layer wiring', () => {
  beforeEach(() => {
    checkoutFromCart.mockReset();
  });

  it('happy path: delegates to checkoutFromCart with the authenticated userId and the requested address, and returns its result unchanged', async () => {
    const fakeOrder = {
      id: 'order-1',
      orderNumber: 'DK-TEST-0001',
      userId: 'user-id',
      status: 'PENDING',
      subtotalAmount: 4999,
      currency: 'INR',
    };
    checkoutFromCart.mockResolvedValueOnce(fakeOrder);

    const { createOrder } = await import('../service');
    const result = await createOrder('user-id', 'address-id');

    expect(checkoutFromCart).toHaveBeenCalledTimes(1);
    expect(checkoutFromCart).toHaveBeenCalledWith('user-id', 'address-id');
    expect(result).toBe(fakeOrder);
  });

  it('never substitutes its own price/total: the returned order is exactly what the repository computed, not something the service recalculates or accepts from a caller', async () => {
    const fakeOrder = { id: 'order-2', subtotalAmount: 123456, currency: 'INR' };
    checkoutFromCart.mockResolvedValueOnce(fakeOrder);

    const { createOrder } = await import('../service');
    // `createOrder`'s signature only accepts (userId, shippingAddressId) —
    // there is no price/total/items parameter for a caller to tamper with
    // in the first place; this asserts the two-argument contract holds and
    // the response subtotal is the repository's, unmodified.
    const result = await createOrder('user-id', 'address-id');

    expect(result.subtotalAmount).toBe(123456);
  });

  it('propagates EmptyCartError instead of swallowing it or returning a partial success', async () => {
    checkoutFromCart.mockRejectedValueOnce(new EmptyCartError());

    const { createOrder } = await import('../service');
    await expect(createOrder('user-id', 'address-id')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      httpStatus: 422,
    });
  });

  it('propagates CartItemStockChangedError (covers both insufficient-stock and deleted/unavailable-product rejections) unchanged', async () => {
    checkoutFromCart.mockRejectedValueOnce(new CartItemStockChangedError('Handmade Vase', 0));

    const { createOrder } = await import('../service');
    await expect(createOrder('user-id', 'address-id')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      httpStatus: 422,
      message: expect.stringContaining('Handmade Vase'),
    });
  });

  it('propagates ShippingAddressNotFoundError as a 404, not a 500 — covers both a foreign shippingAddressId and a nonexistent one, since the repository resolves the address scoped to userId either way', async () => {
    checkoutFromCart.mockRejectedValueOnce(new ShippingAddressNotFoundError());

    const { createOrder } = await import('../service');
    await expect(createOrder('user-id', 'someone-elses-address-id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      httpStatus: 404,
    });
  });
});
