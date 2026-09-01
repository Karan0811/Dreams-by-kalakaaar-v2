// import { withRouteHandler } from '@/shared/middleware/compose';
// import { enforceRateLimit } from '@/shared/middleware/rate-limit';
// import { jsonCollection } from '@/shared/http/response';
// import { listProductsQuerySchema } from '@/modules/products/schemas';
// import * as productsService from '@/modules/products/service';

// export const GET = withRouteHandler(async ({ request, correlationId }) => {
//   const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
//   const rateLimit = await enforceRateLimit('public', ip);

//   const { searchParams } = new URL(request.url);
//   const query = listProductsQuerySchema.parse(Object.fromEntries(searchParams));

//   const result = await productsService.listPublicProducts(query);

//   return jsonCollection({ data: result.data, pagination: result.pagination }, { correlationId, rateLimit });
// });


import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonCollection } from '@/shared/http/response';
import { listProductsQuerySchema } from '@/modules/products/schemas';
import * as productsService from '@/modules/products/service';
import { createModuleLogger } from '@/shared/observability/logger'; // ADDED

const perfLogger = createModuleLogger('products.performance'); // ADDED

export const GET = withRouteHandler(async ({ request, correlationId, requestId }) => { // requestId ADDED to destructure
  const handlerStart = performance.now(); // ADDED

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  const rateLimitStart = performance.now(); // ADDED
  const rateLimit = await enforceRateLimit('public', ip);
  const rateLimitMs = performance.now() - rateLimitStart; // ADDED

  const { searchParams } = new URL(request.url);
  const query = listProductsQuerySchema.parse(Object.fromEntries(searchParams));

  const serviceStart = performance.now(); // ADDED
  const result = await productsService.listPublicProducts(query);
  const serviceMs = performance.now() - serviceStart; // ADDED

  const response = jsonCollection({ data: result.data, pagination: result.pagination }, { correlationId, rateLimit }); // renamed from inline return

  const totalHandlerMs = performance.now() - handlerStart; // ADDED

  perfLogger.info('products.performance', { // ADDED block
    correlationId,
    requestId,
    rateLimitMs: Number(rateLimitMs.toFixed(2)),
    serviceMs: Number(serviceMs.toFixed(2)),
    totalHandlerMs: Number(totalHandlerMs.toFixed(2)),
  });

  return response; // ADDED (was inline `return jsonCollection(...)`)
});