import { ConflictError, NotFoundError } from '@/shared/errors/base-errors';

export class WishlistItemNotFoundError extends NotFoundError {
  constructor() {
    super('This Product is not in your wishlist.');
  }
}

export class WishlistItemAlreadyExistsError extends ConflictError {
  constructor() {
    super('This Product is already in your wishlist.');
  }
}
