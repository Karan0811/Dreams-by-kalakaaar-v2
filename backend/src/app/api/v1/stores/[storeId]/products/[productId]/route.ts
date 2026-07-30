import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorizeOwnerOrPermission } from '@/shared/middleware/authorize';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import {
  productStatusTransitionSchema,
  updateProductSchema,
} from '@/modules/products/schemas';
import { StoreNotFoundError } from '@/modules/products/errors';
import * as productsService from '@/modules/products/service';

async function requireStoreOwnership(userId: string, storeId: string, permission: string) {
  const ownerUserId = await productsService.getStoreOwnerUserId(storeId);
  if (!ownerUserId) throw new StoreNotFoundError();
  await authorizeOwnerOrPermission(userId, { ownerId: ownerUserId, fallbackPermission: permission, storeId });
}

export const GET = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await requireStoreOwnership(auth.userId, params.storeId as string, 'products:read');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const product = await productsService.getProductDetail(params.productId as string);

  return jsonResource(product, { correlationId, rateLimit });
});

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await requireStoreOwnership(auth.userId, params.storeId as string, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const rawBody = await request.json();

  // A single PATCH endpoint serves both field updates and the
  // publish/pause/archive status transition, distinguished by payload
  // shape (09-api-architecture.md Section 6's documented convention for
  // status-machine resources — avoids a proliferation of
  // `/publish`, `/pause`, `/archive` action sub-routes for a 3-state machine).
  if ('status' in (rawBody as Record<string, unknown>)) {
    const body = productStatusTransitionSchema.parse(rawBody);
    const product = await productsService.transitionProductStatus(
      params.productId as string,
      body.status,
    );
    return jsonResource(product, { correlationId, rateLimit });
  }

  const body = updateProductSchema.parse(rawBody);
  const product = await productsService.updateProduct(params.productId as string, body);

  return jsonResource(product, { correlationId, rateLimit });
});
