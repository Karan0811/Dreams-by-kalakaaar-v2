import { eq } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { creators, stores } from '@/shared/db/schema';
import * as productsRepository from './repository';
import { ProductNotFoundError, ProductNotPublishReadyError, StoreNotFoundError } from './errors';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './schemas';

/** Products module Service Layer — 08-database-design.md Section 8. */

/** Resolves the User ID that owns (via Creator) the given Store, for ownership authorization checks. */
export async function getStoreOwnerUserId(storeId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: creators.userId })
    .from(stores)
    .innerJoin(creators, eq(stores.creatorId, creators.id))
    .where(eq(stores.id, storeId))
    .limit(1);

  return row?.userId ?? null;
}

export async function createProduct(storeId: string, input: CreateProductInput) {
  const store = await productsRepository.findStoreById(storeId);
  if (!store) throw new StoreNotFoundError();

  return productsRepository.createProduct(storeId, input);
}

async function getProductOrThrow(productId: string) {
  const product = await productsRepository.findProductById(productId);
  if (!product) throw new ProductNotFoundError();
  return product;
}

export async function getProductDetail(productId: string) {
  const product = await getProductOrThrow(productId);
  const [variants, media] = await Promise.all([
    productsRepository.findVariantsForProduct(productId),
    productsRepository.findMediaForProduct(productId),
  ]);
  return { ...product, variants, media };
}

export async function getPublicProductDetail(idOrSlug: string) {
  const product = await productsRepository.findPublicProductByIdOrSlug(idOrSlug);
  if (!product) throw new ProductNotFoundError();

  const [variants, media] = await Promise.all([
    productsRepository.findVariantsForProduct(product.id),
    productsRepository.findMediaForProduct(product.id),
  ]);
  return { ...product, variants, media };
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  await getProductOrThrow(productId);
  const updated = await productsRepository.updateProduct(productId, input);
  if (!updated) throw new ProductNotFoundError();
  return updated;
}

/**
 * 08-database-design.md Section 8.1's publish-readiness rule: a Product may
 * only move DRAFT/PAUSED → ACTIVE once it has at least one media asset (a
 * buyer cannot evaluate a listing with no photo) and every variant has an
 * Inventory row (guaranteed by `createProduct`'s transaction, checked again
 * defensively here in case of future manual variant additions).
 */
export async function transitionProductStatus(
  productId: string,
  targetStatus: 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
) {
  await getProductOrThrow(productId);

  if (targetStatus === 'ACTIVE') {
    const [mediaCount, variantsMissingInventory] = await Promise.all([
      productsRepository.countMediaForProduct(productId),
      productsRepository.countVariantsMissingInventory(productId),
    ]);

    const reasons: string[] = [];
    if (mediaCount === 0) reasons.push('At least one product photo is required.');
    if (variantsMissingInventory > 0) {
      reasons.push('Every variant must have an inventory record.');
    }

    if (reasons.length > 0) throw new ProductNotPublishReadyError(reasons);
  }

  const updated = await productsRepository.updateProductStatus(productId, targetStatus);
  if (!updated) throw new ProductNotFoundError();
  return updated;
}

export async function listStoreProducts(storeId: string, query: ListProductsQuery) {
  const store = await productsRepository.findStoreById(storeId);
  if (!store) throw new StoreNotFoundError();

  return productsRepository.listProductsForStore(storeId, query);
}

export async function listPublicProducts(query: ListProductsQuery) {
  return productsRepository.listPublicProducts(query);
}
