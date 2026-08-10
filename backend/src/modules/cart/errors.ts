import { NotFoundError, ValidationError } from '@/shared/errors/base-errors';

export class CartItemNotFoundError extends NotFoundError {
  constructor() {
    super('Cart item not found.');
  }
}

export class ProductVariantNotAvailableError extends ValidationError {
  constructor() {
    super('This product variant is no longer available.', undefined, 422);
  }
}

export class InsufficientStockError extends ValidationError {
  constructor(available: number) {
    super(`Only ${available} unit(s) available for this variant.`, undefined, 422);
  }
}
