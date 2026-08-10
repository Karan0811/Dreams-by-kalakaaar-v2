import { describe, expect, it } from 'vitest';
import { createReviewSchema, updateReviewSchema } from '../schemas';

describe('createReviewSchema', () => {
  const productId = '123e4567-e89b-12d3-a456-426614174000';

  it('accepts a minimal valid review', () => {
    const result = createReviewSchema.parse({ productId, rating: 5, body: 'Loved it!' });
    expect(result.rating).toBe(5);
  });

  it('rejects a rating of 0', () => {
    expect(createReviewSchema.safeParse({ productId, rating: 0, body: 'x' }).success).toBe(false);
  });

  it('rejects a rating above 5', () => {
    expect(createReviewSchema.safeParse({ productId, rating: 6, body: 'x' }).success).toBe(false);
  });

  it('rejects an empty body', () => {
    expect(createReviewSchema.safeParse({ productId, rating: 4, body: '' }).success).toBe(false);
  });

  it('accepts an optional title', () => {
    const result = createReviewSchema.parse({ productId, rating: 4, body: 'Good', title: 'Nice!' });
    expect(result.title).toBe('Nice!');
  });
});

describe('updateReviewSchema', () => {
  it('accepts a partial update', () => {
    expect(updateReviewSchema.parse({ rating: 3 }).rating).toBe(3);
  });

  it('rejects an out-of-range rating', () => {
    expect(updateReviewSchema.safeParse({ rating: 10 }).success).toBe(false);
  });
});
