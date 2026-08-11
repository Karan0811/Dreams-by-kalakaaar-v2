import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { productStatusTransitionSchema, updateProductSchema } from '@/modules/products/schemas';
import { requireStoreProductOwnership } from '@/modules/products/authorization';
import * as productsService from '@/modules/products/service';

export const GET = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await requireStoreProductOwnership(auth.userId, params.storeId as string, params.productId as string, 'products:read');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const product = await productsService.getProductDetail(params.productId as string);

  return jsonResource(product, { correlationId, rateLimit });
});

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await requireStoreProductOwnership(auth.userId, params.storeId as string, params.productId as string, 'products:write');
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

/**
 * Soft delete — Sprint 01. Sets `deletedAt`; the row is preserved (order
 * history, if any, may still reference it) but disappears from every
 * creator- and buyer-facing query from this point on. This is deliberately
 * a hard "remove the listing" action, distinct from the PATCH-driven
 * `ARCHIVED` status above (a creator can un-archive; a creator cannot
 * un-delete through this API).
 */
export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await requireStoreProductOwnership(auth.userId, params.storeId as string, params.productId as string, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await productsService.deleteProduct(params.productId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
