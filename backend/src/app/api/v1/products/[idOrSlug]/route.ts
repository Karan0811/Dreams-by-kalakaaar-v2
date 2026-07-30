import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import * as productsService from '@/modules/products/service';

export const GET = withRouteHandler(async ({ request, correlationId, params }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('public', ip);

  const product = await productsService.getPublicProductDetail(params.idOrSlug as string);

  return jsonResource(product, { correlationId, rateLimit });
});
