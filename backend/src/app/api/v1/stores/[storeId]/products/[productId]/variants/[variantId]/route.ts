import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { updateProductVariantSchema } from '@/modules/products/schemas';
import { requireStoreProductOwnership } from '@/modules/products/authorization';
import * as productsService from '@/modules/products/service';

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, params.productId as string, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateProductVariantSchema.parse(await request.json());
  const variant = await productsService.updateVariant(
    params.productId as string,
    params.variantId as string,
    body,
  );

  return jsonResource(variant, { correlationId, rateLimit });
});

/**
 * Removes a Variant. This is an archive, not a hard delete — see
 * `modules/products/repository.ts`'s `archiveProductVariant` doc comment
 * for why (historical Orders reference variants with `onDelete: 'restrict'`).
 */
export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, params.productId as string, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const variant = await productsService.archiveVariant(
    params.productId as string,
    params.variantId as string,
  );

  return jsonResource(variant, { correlationId, rateLimit });
});
