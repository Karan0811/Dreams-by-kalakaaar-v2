import { describe, expect, it } from 'vitest';
import { addWishlistItemSchema } from '../schemas';

describe('addWishlistItemSchema', () => {
  it('accepts a valid UUID productId', () => {
    const result = addWishlistItemSchema.parse({ productId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(result.productId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('rejects a non-UUID productId', () => {
    expect(addWishlistItemSchema.safeParse({ productId: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects a missing productId', () => {
    expect(addWishlistItemSchema.safeParse({}).success).toBe(false);
  });
});
