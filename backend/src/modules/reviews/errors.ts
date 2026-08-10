import { ConflictError, NotFoundError } from '@/shared/errors/base-errors';

export class ReviewNotFoundError extends NotFoundError {
  constructor() {
    super('Review not found.');
  }
}

export class ReviewAlreadyExistsError extends ConflictError {
  constructor() {
    super('You have already reviewed this product. Edit your existing review instead.');
  }
}
