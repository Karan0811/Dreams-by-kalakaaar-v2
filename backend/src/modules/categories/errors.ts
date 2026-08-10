import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors/base-errors';

export class CategoryNotFoundError extends NotFoundError {
  constructor() {
    super('Category not found.');
  }
}

export class CategorySlugAlreadyExistsError extends ConflictError {
  constructor() {
    super('A Category with this slug already exists.');
  }
}

export class CategoryParentNotFoundError extends ValidationError {
  constructor() {
    super('The specified parent Category does not exist.', undefined, 422);
  }
}

export class CategoryCannotBeOwnParentError extends ValidationError {
  constructor() {
    super('A Category cannot be its own parent.', undefined, 422);
  }
}

export class SubcategoryCannotHaveChildrenError extends ValidationError {
  constructor() {
    super('A Subcategory cannot itself have Subcategories (only one level of nesting is supported).', undefined, 422);
  }
}

export class CategoryHasSubcategoriesError extends ConflictError {
  constructor() {
    super('Cannot delete a Category that still has Subcategories. Delete or move them first.');
  }
}

export class CategoryHasProductsError extends ConflictError {
  constructor() {
    super('Cannot delete a Category that still has Products assigned to it.');
  }
}
