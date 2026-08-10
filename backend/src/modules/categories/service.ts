import * as categoriesRepository from './repository';
import {
  CategoryNotFoundError,
  CategorySlugAlreadyExistsError,
  CategoryParentNotFoundError,
  CategoryCannotBeOwnParentError,
  SubcategoryCannotHaveChildrenError,
  CategoryHasSubcategoriesError,
  CategoryHasProductsError,
} from './errors';
import type { CreateCategoryInput, ListCategoriesQuery, UpdateCategoryInput } from './schemas';

export async function listCategories(query: ListCategoriesQuery) {
  return categoriesRepository.listCategories(query);
}

export async function getCategory(categoryId: string) {
  const category = await categoriesRepository.findCategoryById(categoryId);
  if (!category) throw new CategoryNotFoundError();
  return category;
}

export async function getCategoryBySlug(slug: string) {
  const category = await categoriesRepository.findCategoryBySlug(slug);
  if (!category) throw new CategoryNotFoundError();
  return category;
}

export async function createCategory(input: CreateCategoryInput) {
  if (input.parentId) {
    const parent = await categoriesRepository.findCategoryById(input.parentId);
    if (!parent) throw new CategoryParentNotFoundError();
    // Only one level of nesting is supported (Category -> Subcategory), matching
    // the brief's "Category CRUD" / "Subcategory CRUD" as two flat lists, not an
    // arbitrarily deep tree.
    if (parent.parentId) throw new SubcategoryCannotHaveChildrenError();
  }

  if (input.slug) {
    const existing = await categoriesRepository.findCategoryBySlug(input.slug);
    if (existing) throw new CategorySlugAlreadyExistsError();
  }

  return categoriesRepository.createCategory(input);
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const existing = await categoriesRepository.findCategoryById(categoryId);
  if (!existing) throw new CategoryNotFoundError();

  if (input.slug && input.slug !== existing.slug) {
    const slugOwner = await categoriesRepository.findCategoryBySlug(input.slug);
    if (slugOwner && slugOwner.id !== categoryId) throw new CategorySlugAlreadyExistsError();
  }

  const updated = await categoriesRepository.updateCategory(categoryId, input);
  if (!updated) throw new CategoryNotFoundError();
  return updated;
}

/** A Category can't be re-parented onto itself — checked here since it's a cross-field invariant `updateCategorySchema` alone can't express. */
export async function setCategoryParent(categoryId: string, parentId: string | null) {
  if (parentId === categoryId) throw new CategoryCannotBeOwnParentError();

  const existing = await categoriesRepository.findCategoryById(categoryId);
  if (!existing) throw new CategoryNotFoundError();

  if (parentId) {
    const parent = await categoriesRepository.findCategoryById(parentId);
    if (!parent) throw new CategoryParentNotFoundError();
    if (parent.parentId) throw new SubcategoryCannotHaveChildrenError();
  }

  const subcategoryCount = await categoriesRepository.countSubcategories(categoryId);
  if (subcategoryCount > 0 && parentId) {
    // Promoting a Category-with-Subcategories into someone else's Subcategory
    // would create 3 levels of nesting — reuse the same one-level-only rule.
    throw new SubcategoryCannotHaveChildrenError();
  }

  const updated = await categoriesRepository.updateCategoryParent(categoryId, parentId);
  if (!updated) throw new CategoryNotFoundError();
  return updated;
}

export async function deleteCategory(categoryId: string) {
  const existing = await categoriesRepository.findCategoryById(categoryId);
  if (!existing) throw new CategoryNotFoundError();

  const [subcategoryCount, productCount] = await Promise.all([
    categoriesRepository.countSubcategories(categoryId),
    categoriesRepository.countProductsInCategory(categoryId),
  ]);
  if (subcategoryCount > 0) throw new CategoryHasSubcategoriesError();
  if (productCount > 0) throw new CategoryHasProductsError();

  const deleted = await categoriesRepository.softDeleteCategory(categoryId);
  if (!deleted) throw new CategoryNotFoundError();
  return deleted;
}
