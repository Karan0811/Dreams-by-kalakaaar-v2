import { authorizeOwnerOrPermission } from '@/shared/middleware/authorize';
import { StoreNotFoundError } from './errors';
import * as productsService from './service';

/**
 * Shared by every creator-side Product/Media/Inventory Route Handler
 * (`stores/[storeId]/products/...`) so the ownership check — "does this
 * user own the Store this resource is nested under, or hold the fallback
 * RBAC permission" — is written once, not re-implemented per sub-resource.
 */
export async function requireStoreProductOwnership(
  userId: string,
  storeId: string,
  permission: string,
): Promise<void> {
  const ownerUserId = await productsService.getStoreOwnerUserId(storeId);
  if (!ownerUserId) throw new StoreNotFoundError();
  await authorizeOwnerOrPermission(userId, { ownerId: ownerUserId, fallbackPermission: permission, storeId });
}
