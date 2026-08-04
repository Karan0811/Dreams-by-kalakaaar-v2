import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/shared/db/client';
import { creators, stores } from '@/shared/db/schema';
import { createPresignedUploadUrl, deleteObject, publicUrlForKey } from '@/shared/storage/r2-client';
import { createModuleLogger } from '@/shared/observability/logger';
import * as productsRepository from './repository';
import {
  MediaAlreadyAttachedError,
  ProductMediaNotFoundError,
  ProductNotFoundError,
  ProductNotPublishReadyError,
  ProductVariantNotFoundError,
  StoreNotFoundError,
} from './errors';
import type {
  AdjustInventoryInput,
  AttachProductMediaInput,
  CreateProductInput,
  ListProductsQuery,
  ListStoreProductsQuery,
  RequestProductMediaUploadInput,
  UpdateProductInput,
  UpdateProductMediaInput,
} from './schemas';

/** Products module Service Layer — 08-database-design.md Section 8. */

const logger = createModuleLogger('products.service');

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

  const product = await productsRepository.createProduct(storeId, input);
  logger.info('Product created', { storeId, productId: product.id, variantCount: input.variants.length });
  return product;
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

  const [enriched] = await productsRepository.enrichProductsForPublicResponse([product]);
  if (!enriched) throw new ProductNotFoundError();
  return enriched;
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

    if (reasons.length > 0) {
      logger.warn('Publish blocked by readiness check', { productId, reasons });
      throw new ProductNotPublishReadyError(reasons);
    }
  }

  const updated = await productsRepository.updateProductStatus(productId, targetStatus);
  if (!updated) throw new ProductNotFoundError();
  logger.info('Product status changed', { productId, targetStatus });
  return updated;
}

/** Sprint 01 — soft delete. A deleted Product disappears from every creator and buyer query immediately. */
export async function deleteProduct(productId: string) {
  await getProductOrThrow(productId);
  const deleted = await productsRepository.softDeleteProduct(productId);
  if (!deleted) throw new ProductNotFoundError();
  logger.warn('Product soft-deleted', { productId });
  return deleted;
}

export async function listStoreProducts(storeId: string, query: ListStoreProductsQuery) {
  const store = await productsRepository.findStoreById(storeId);
  if (!store) throw new StoreNotFoundError();

  return productsRepository.listProductsForStore(storeId, query);
}

export async function listPublicProducts(query: ListProductsQuery) {
  return productsRepository.listPublicProducts(query);
}

/* ------------------------------------------------------------------------ */
/* Sprint 01 — Product Images                                               */
/* ------------------------------------------------------------------------ */

/**
 * Step 1 of the two-step upload flow (10-backend-architecture.md Section 11):
 * the client never proxies file bytes through this API — it uploads directly
 * to R2 using the presigned URL returned here, then calls `attachProductMedia`
 * to confirm. This keeps large file bodies off the Next.js Route Handler
 * entirely.
 */
export async function requestProductMediaUpload(
  productId: string,
  uploadedById: string,
  input: RequestProductMediaUploadInput,
) {
  await getProductOrThrow(productId);

  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const storageKey = `products/${productId}/${randomUUID()}-${safeFileName}`;

  const [uploadUrl] = await Promise.all([
    createPresignedUploadUrl({ key: storageKey, contentType: input.contentType }),
  ]);

  const mediaRow = await productsRepository.createPendingMediaRow({
    uploadedById,
    storageKey,
    publicUrl: publicUrlForKey(storageKey),
    mimeType: input.contentType,
    sizeBytes: input.sizeBytes,
  });

  return { uploadUrl, mediaId: mediaRow.id, publicUrl: mediaRow.publicUrl };
}

/** Step 2: confirm the direct upload succeeded and attach the media to this Product's gallery. */
export async function attachProductMedia(productId: string, input: AttachProductMediaInput) {
  await getProductOrThrow(productId);

  const mediaRow = await productsRepository.findMediaById(input.mediaId);
  if (!mediaRow) throw new ProductMediaNotFoundError();
  if (mediaRow.status === 'READY') throw new MediaAlreadyAttachedError();

  await productsRepository.markMediaReady(input.mediaId, input.altText);
  return productsRepository.attachMediaToProduct(productId, input);
}

export async function updateProductMedia(
  productId: string,
  productMediaId: string,
  input: UpdateProductMediaInput,
) {
  const existing = await productsRepository.findProductMediaRow(productId, productMediaId);
  if (!existing) throw new ProductMediaNotFoundError();

  const updated = await productsRepository.updateProductMediaRow(productId, productMediaId, input);
  if (!updated) throw new ProductMediaNotFoundError();
  return updated;
}

export async function deleteProductMedia(productId: string, productMediaId: string) {
  const existing = await productsRepository.findProductMediaRow(productId, productMediaId);
  if (!existing) throw new ProductMediaNotFoundError();

  const deleted = await productsRepository.deleteProductMediaRow(productId, productMediaId);
  if (!deleted) throw new ProductMediaNotFoundError();

  const mediaRow = await productsRepository.findMediaById(existing.mediaId);
  if (mediaRow) {
    // Best-effort: the DB row is already gone (source of truth for the
    // gallery), so a storage-delete failure here doesn't roll back into a
    // retry loop — it's logged instead, since nothing else surfaces it.
    await deleteObject(mediaRow.storageKey).catch((error: unknown) =>
      logger.error('Failed to delete R2 object for removed media', error, {
        productId,
        productMediaId,
        storageKey: mediaRow.storageKey,
      }),
    );
  }

  return deleted;
}

/* ------------------------------------------------------------------------ */
/* Sprint 01 — Inventory Management                                         */
/* ------------------------------------------------------------------------ */

export async function adjustVariantInventory(
  productId: string,
  variantId: string,
  input: AdjustInventoryInput,
) {
  const variant = await productsRepository.findVariantById(variantId);
  if (!variant || variant.productId !== productId) throw new ProductVariantNotFoundError();

  const updated = await productsRepository.adjustVariantInventory(variantId, input);
  if (!updated) throw new ProductVariantNotFoundError();

  // A log line is the only audit trail until the InventoryTransaction
  // ledger (08-database-design.md §9.2, deferred per backend/SCOPE.md) exists.
  logger.info('Inventory adjusted', {
    productId,
    variantId,
    quantityDelta: input.quantityDelta,
    reason: input.reason,
    resultingQuantity: updated.quantityAvailable,
  });

  return updated;
}
