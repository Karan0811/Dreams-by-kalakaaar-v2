import { describe, expect, it } from 'vitest';
import { cancelOrderSchema, createOrderSchema, listMyOrdersQuerySchema, updateOrderStatusSchema } from '../schemas';

describe('createOrderSchema', () => {
  it('requires a valid shippingAddressId', () => {
    expect(createOrderSchema.safeParse({}).success).toBe(false);
    expect(
      createOrderSchema.safeParse({ shippingAddressId: '123e4567-e89b-12d3-a456-426614174000' }).success,
    ).toBe(true);
  });
});

describe('cancelOrderSchema', () => {
  it('allows an omitted reason', () => {
    expect(cancelOrderSchema.parse({}).reason).toBeUndefined();
  });

  it('rejects a reason over 500 characters', () => {
    expect(cancelOrderSchema.safeParse({ reason: 'x'.repeat(501) }).success).toBe(false);
  });
});

describe('updateOrderStatusSchema', () => {
  it('accepts every valid forward status', () => {
    for (const status of ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']) {
      expect(updateOrderStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it('rejects PENDING as a target status (not a valid admin transition target)', () => {
    expect(updateOrderStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(false);
  });
});

describe('listMyOrdersQuerySchema', () => {
  it('applies default limit/offset', () => {
    const result = listMyOrdersQuerySchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('coerces string query params to numbers', () => {
    const result = listMyOrdersQuerySchema.parse({ limit: '5', offset: '10' });
    expect(result.limit).toBe(5);
    expect(result.offset).toBe(10);
  });

  it('rejects a limit above 100', () => {
    expect(listMyOrdersQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });
});
