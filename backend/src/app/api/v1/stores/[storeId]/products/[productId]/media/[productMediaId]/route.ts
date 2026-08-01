import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { updateProductMediaSchema } from '@/modules/products/schemas';
import { requireStoreProductOwnership } from '@/modules/products/authorization';
import * as productsService from '@/modules/products/service';

/** Reorder, re-caption, or re-pick the primary image for one gallery entry. */
export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateProductMediaSchema.parse(await request.json());
  const productMedia = await productsService.updateProductMedia(
    params.productId as string,
    params.productMediaId as string,
    body,
  );

  return jsonResource(productMedia, { correlationId, rateLimit });
});

/** Removes one image from the gallery (and best-effort deletes the R2 object). */
export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await productsService.deleteProductMedia(params.productId as string, params.productMediaId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
