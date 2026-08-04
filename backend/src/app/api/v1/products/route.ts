import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonCollection } from '@/shared/http/response';
import { listProductsQuerySchema } from '@/modules/products/schemas';
import * as productsService from '@/modules/products/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('public', ip);

  const { searchParams } = new URL(request.url);
  const query = listProductsQuerySchema.parse(Object.fromEntries(searchParams));

  const result = await productsService.listPublicProducts(query);

  return jsonCollection({ data: result.data, pagination: result.pagination }, { correlationId, rateLimit });
});
