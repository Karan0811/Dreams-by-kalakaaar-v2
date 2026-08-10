import { describe, expect, it } from 'vitest';
import {
  createCategorySchema,
  listCategoriesQuerySchema,
  setCategoryParentSchema,
  updateCategorySchema,
} from '../schemas';

describe('createCategorySchema', () => {
  it('accepts a minimal top-level category (no slug, no parentId)', () => {
    const result = createCategorySchema.parse({ name: 'Jewelry' });
    expect(result.name).toBe('Jewelry');
    expect(result.parentId).toBeUndefined();
    expect(result.displayOrder).toBe(0);
  });

  it('lowercases and validates a provided slug', () => {
    const result = createCategorySchema.parse({ name: 'Rings', slug: 'Rings' });
    expect(result.slug).toBe('rings');
  });

  it('rejects a slug with invalid characters', () => {
    expect(createCategorySchema.safeParse({ name: 'Rings', slug: 'rings!!' }).success).toBe(false);
  });

  it('accepts an explicit parentId for a subcategory', () => {
    const parentId = '123e4567-e89b-12d3-a456-426614174000';
    const result = createCategorySchema.parse({ name: 'Rings', parentId });
    expect(result.parentId).toBe(parentId);
  });

  it('rejects a name under 2 characters', () => {
    expect(createCategorySchema.safeParse({ name: 'J' }).success).toBe(false);
  });
});

describe('updateCategorySchema', () => {
  it('accepts a partial update', () => {
    expect(updateCategorySchema.parse({ displayOrder: 5 }).displayOrder).toBe(5);
  });

  it('allows description to be explicitly nulled', () => {
    expect(updateCategorySchema.parse({ description: null }).description).toBeNull();
  });
});

describe('listCategoriesQuerySchema', () => {
  it('defaults flat to false with no parentId', () => {
    const result = listCategoriesQuerySchema.parse({});
    expect(result.flat).toBe(false);
    expect(result.parentId).toBeUndefined();
  });

  it('parses flat=true from a query string', () => {
    expect(listCategoriesQuerySchema.parse({ flat: 'true' }).flat).toBe(true);
  });
});

describe('setCategoryParentSchema', () => {
  it('accepts a null parentId (promote to top-level)', () => {
    expect(setCategoryParentSchema.parse({ parentId: null }).parentId).toBeNull();
  });

  it('requires the parentId key to be present', () => {
    expect(setCategoryParentSchema.safeParse({}).success).toBe(false);
  });
});
