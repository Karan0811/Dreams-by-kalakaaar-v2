import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { attachProductMediaSchema } from '@/modules/products/schemas';
import { requireStoreProductOwnership } from '@/modules/products/authorization';
import * as productsService from '@/modules/products/service';

/**
 * Step 2 of Product Image upload — Sprint 01. Confirms the direct-to-R2
 * upload from `media/upload-url` succeeded and attaches the media asset to
 * this Product's ordered gallery (`shared/db/schema/product.ts`'s
 * `productMedia` join table).
 */
export const POST = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = attachProductMediaSchema.parse(await request.json());
  const productMedia = await productsService.attachProductMedia(params.productId as string, body);

  return jsonResource(productMedia, { correlationId, rateLimit }, 201);
});
