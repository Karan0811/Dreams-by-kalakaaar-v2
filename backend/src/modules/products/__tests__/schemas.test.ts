import { describe, expect, it } from 'vitest';
import {
  adjustInventorySchema,
  attachProductMediaSchema,
  createProductVariantSchema,
  listProductsQuerySchema,
  listStoreProductsQuerySchema,
  productSortSchema,
  requestProductMediaUploadSchema,
  sortUsesCursorPagination,
  updateProductVariantSchema,
} from '../schemas';

describe('productSortSchema / sortUsesCursorPagination', () => {
  it('defaults to newest', () => {
    expect(productSortSchema.parse(undefined)).toBe('newest');
  });

  it('treats newest/oldest as cursor-paginated', () => {
    expect(sortUsesCursorPagination('newest')).toBe(true);
    expect(sortUsesCursorPagination('oldest')).toBe(true);
  });

  it('treats price/popularity sorts as page-paginated', () => {
    expect(sortUsesCursorPagination('priceLow')).toBe(false);
    expect(sortUsesCursorPagination('priceHigh')).toBe(false);
    expect(sortUsesCursorPagination('bestSelling')).toBe(false);
  });

  it('rejects an unknown sort value', () => {
    expect(productSortSchema.safeParse('cheapest').success).toBe(false);
  });
});

describe('listProductsQuerySchema', () => {
  it('accepts a fully-specified structured filter set', () => {
    const result = listProductsQuerySchema.safeParse({
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      q: 'resin keychain',
      minPrice: '500',
      maxPrice: '2000',
      inStockOnly: 'true',
      sort: 'priceLow',
      page: '2',
      limit: '10',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minPrice).toBe(500);
      expect(result.data.inStockOnly).toBe(true);
      expect(result.data.page).toBe(2);
    }
  });

  it('rejects minPrice greater than maxPrice', () => {
    const result = listProductsQuerySchema.safeParse({ minPrice: '5000', maxPrice: '1000' });
    expect(result.success).toBe(false);
  });

  it('defaults page to 1 and sort to newest when omitted', () => {
    const result = listProductsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.sort).toBe('newest');
  });
});

describe('listStoreProductsQuerySchema', () => {
  it('accepts a creator-only status filter', () => {
    const result = listStoreProductsQuerySchema.safeParse({ status: 'DRAFT' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status value', () => {
    const result = listStoreProductsQuerySchema.safeParse({ status: 'DELETED' });
    expect(result.success).toBe(false);
  });
});

describe('adjustInventorySchema', () => {
  it('accepts a positive delta', () => {
    expect(adjustInventorySchema.safeParse({ quantityDelta: 10 }).success).toBe(true);
  });

  it('accepts a negative delta', () => {
    expect(adjustInventorySchema.safeParse({ quantityDelta: -5 }).success).toBe(true);
  });

  it('rejects a zero delta', () => {
    expect(adjustInventorySchema.safeParse({ quantityDelta: 0 }).success).toBe(false);
  });
});

describe('requestProductMediaUploadSchema', () => {
  it('rejects a disallowed content type', () => {
    const result = requestProductMediaUploadSchema.safeParse({
      fileName: 'photo.gif',
      contentType: 'image/gif',
      sizeBytes: 1024,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a file over 10MB', () => {
    const result = requestProductMediaUploadSchema.safeParse({
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 11 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
  });
});

describe('attachProductMediaSchema', () => {
  it('requires non-empty alt text', () => {
    const result = attachProductMediaSchema.safeParse({
      mediaId: '123e4567-e89b-12d3-a456-426614174000',
      altText: 'a',
    });
    expect(result.success).toBe(false);
  });
});

describe('createProductVariantSchema (Sprint 02)', () => {
  it('accepts a minimal variant and applies defaults', () => {
    const result = createProductVariantSchema.parse({ priceAmount: 1500 });
    expect(result.priceCurrency).toBe('INR');
    expect(result.initialQuantity).toBe(0);
    expect(result.attributes).toEqual({});
  });

  it('rejects a negative price', () => {
    expect(createProductVariantSchema.safeParse({ priceAmount: -100 }).success).toBe(false);
  });

  it('accepts a full variant with attributes and SKU', () => {
    const result = createProductVariantSchema.parse({
      attributes: { size: '8', color: 'gold' },
      priceAmount: 2000,
      skuReference: 'RING-8-GOLD',
      initialQuantity: 12,
    });
    expect(result.skuReference).toBe('RING-8-GOLD');
    expect(result.initialQuantity).toBe(12);
  });
});

describe('updateProductVariantSchema (Sprint 02)', () => {
  it('accepts a partial price-only update', () => {
    expect(updateProductVariantSchema.parse({ priceAmount: 1800 }).priceAmount).toBe(1800);
  });

  it('accepts an ARCHIVED status transition', () => {
    expect(updateProductVariantSchema.parse({ status: 'ARCHIVED' }).status).toBe('ARCHIVED');
  });

  it('rejects an invalid status value', () => {
    expect(updateProductVariantSchema.safeParse({ status: 'DELETED' }).success).toBe(false);
  });
});
