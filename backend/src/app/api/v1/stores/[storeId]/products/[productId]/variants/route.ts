import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { createProductVariantSchema } from '@/modules/products/schemas';
import { requireStoreProductOwnership } from '@/modules/products/authorization';
import * as productsService from '@/modules/products/service';

export const GET = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, 'products:read');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const variants = await productsService.listVariants(params.productId as string);

  return jsonResource({ data: variants }, { correlationId, rateLimit });
});

export const POST = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = createProductVariantSchema.parse(await request.json());
  const variant = await productsService.createVariant(params.productId as string, body);

  return jsonResource(variant, { correlationId, rateLimit }, 201);
});
