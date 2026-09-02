import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { addCartItemSchema } from '@/modules/cart/schemas';
import * as cartService from '@/modules/cart/service';
import { createModuleLogger } from '@/shared/observability/logger';

const perfLogger = createModuleLogger('cart.performance');

export const GET = withRouteHandler(async ({ request, correlationId, requestId }) => {
  const startedAt = performance.now();
  const auth = await authenticate(request);
  const authenticatedAt = performance.now();
  const rateLimit = await enforceRateLimit('standard', auth.userId);
  const rateLimitedAt = performance.now();

  const cart = await cartService.getMyCart(auth.userId);
  const completedAt = performance.now();

  perfLogger.info('cart.performance', {
    correlationId,
    requestId,
    authenticateMs: Number((authenticatedAt - startedAt).toFixed(2)),
    rateLimitMs: Number((rateLimitedAt - authenticatedAt).toFixed(2)),
    serviceMs: Number((completedAt - rateLimitedAt).toFixed(2)),
    totalHandlerMs: Number((completedAt - startedAt).toFixed(2)),
  });

  return jsonResource(cart, { correlationId, rateLimit });
});

/** Adding a variant already in the cart merges quantities rather than creating a duplicate row (see `service.ts`'s `addToMyCart`). */
export const POST = withRouteHandler(async ({ request, correlationId, requestId }) => {
  const startedAt = performance.now();
  const auth = await authenticate(request);
  const authenticatedAt = performance.now();
  const rateLimit = await enforceRateLimit('standard', auth.userId);
  const rateLimitedAt = performance.now();

  const body = addCartItemSchema.parse(await request.json());
  const item = await cartService.addToMyCart(auth.userId, body.variantId, body.quantity);
  const completedAt = performance.now();

  perfLogger.info('cart.performance', {
    correlationId,
    requestId,
    authenticateMs: Number((authenticatedAt - startedAt).toFixed(2)),
    rateLimitMs: Number((rateLimitedAt - authenticatedAt).toFixed(2)),
    serviceMs: Number((completedAt - rateLimitedAt).toFixed(2)),
    totalHandlerMs: Number((completedAt - startedAt).toFixed(2)),
  });

  return jsonResource(item, { correlationId, rateLimit }, 201);
});
