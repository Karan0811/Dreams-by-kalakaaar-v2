import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors/base-errors';

export class ProductNotFoundError extends NotFoundError {
  constructor() {
    super('Product not found.');
  }
}

export class StoreNotFoundError extends NotFoundError {
  constructor() {
    super('Store not found.');
  }
}

/** 08-database-design.md Section 8.1's publish-readiness constraint. */
export class ProductNotPublishReadyError extends ValidationError {
  constructor(reasons: string[]) {
    super(
      'This product cannot be published yet.',
      reasons.map((issue) => ({ issue })),
      422,
    );
  }
}

/** Sprint 01 — Product Images. */
export class ProductMediaNotFoundError extends NotFoundError {
  constructor() {
    super('Product image not found.');
  }
}

export class MediaAlreadyAttachedError extends ConflictError {
  constructor() {
    super('This media asset has already been attached to a product.');
  }
}

/** Sprint 01 — Inventory Management. */
export class ProductVariantNotFoundError extends NotFoundError {
  constructor() {
    super('Product variant not found.');
  }
}
