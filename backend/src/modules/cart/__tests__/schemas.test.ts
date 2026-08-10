import { describe, expect, it } from 'vitest';
import { addCartItemSchema, updateCartItemSchema } from '../schemas';

describe('addCartItemSchema', () => {
  const variantId = '123e4567-e89b-12d3-a456-426614174000';

  it('defaults quantity to 1', () => {
    const result = addCartItemSchema.parse({ variantId });
    expect(result.quantity).toBe(1);
  });

  it('accepts an explicit quantity', () => {
    const result = addCartItemSchema.parse({ variantId, quantity: 5 });
    expect(result.quantity).toBe(5);
  });

  it('rejects quantity 0', () => {
    expect(addCartItemSchema.safeParse({ variantId, quantity: 0 }).success).toBe(false);
  });

  it('rejects quantity above 99', () => {
    expect(addCartItemSchema.safeParse({ variantId, quantity: 100 }).success).toBe(false);
  });

  it('rejects a non-integer quantity', () => {
    expect(addCartItemSchema.safeParse({ variantId, quantity: 2.5 }).success).toBe(false);
  });
});

describe('updateCartItemSchema', () => {
  it('requires a quantity', () => {
    expect(updateCartItemSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a valid quantity', () => {
    expect(updateCartItemSchema.parse({ quantity: 3 }).quantity).toBe(3);
  });
});
