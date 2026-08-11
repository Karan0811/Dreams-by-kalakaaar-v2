import { authorizeOwnerOrPermission } from '@/shared/middleware/authorize';
import { StoreNotFoundError, ProductNotFoundError } from './errors';
import * as productsService from './service';

/**
 * Shared by every creator-side Product/Media/Variant/Inventory Route
 * Handler (`stores/[storeId]/products/[productId]/...`) so the ownership
 * check is written once, not re-implemented per sub-resource. Verifies
 * BOTH:
 *   1. the caller owns (or holds the fallback permission for) `storeId`, and
 *   2. `productId` actually belongs to `storeId` — both are independent,
 *      client-supplied URL params, so (1) alone lets any store owner act on
 *      any product in the system by pairing their own storeId with someone
 *      else's productId.
 */
export async function requireStoreProductOwnership(
  userId: string,
  storeId: string,
  productId: string,
  permission: string,
): Promise<void> {
  const ownerUserId = await productsService.getStoreOwnerUserId(storeId);
  if (!ownerUserId) throw new StoreNotFoundError();
  await authorizeOwnerOrPermission(userId, { ownerId: ownerUserId, fallbackPermission: permission, storeId });

  const productStoreId = await productsService.getProductStoreId(productId);
  if (productStoreId !== storeId) throw new ProductNotFoundError();
}
