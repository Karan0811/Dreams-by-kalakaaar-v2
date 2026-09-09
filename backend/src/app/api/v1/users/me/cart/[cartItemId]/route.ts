import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { updateCartItemSchema } from '@/modules/cart/schemas';
import * as cartService from '@/modules/cart/service';
import { createModuleLogger } from '@/shared/observability/logger';

const perfLogger = createModuleLogger('cart.performance');

function logCartTiming(
  action: 'update' | 'remove',
  correlationId: string,
  requestId: string,
  startedAt: number,
  authenticatedAt: number,
  rateLimitedAt: number,
  completedAt: number,
) {
  perfLogger.info('cart.performance', {
    action,
    correlationId,
    requestId,
    authenticateMs: Number((authenticatedAt - startedAt).toFixed(2)),
    rateLimitMs: Number((rateLimitedAt - authenticatedAt).toFixed(2)),
    serviceMs: Number((completedAt - rateLimitedAt).toFixed(2)),
    totalHandlerMs: Number((completedAt - startedAt).toFixed(2)),
  });
}

export const PATCH = withRouteHandler(async ({ request, correlationId, requestId, params }) => {
  const startedAt = performance.now();
  const auth = await authenticate(request);
  const authenticatedAt = performance.now();
  const rateLimit = await enforceRateLimit('standard', auth.userId);
  const rateLimitedAt = performance.now();

  const body = updateCartItemSchema.parse(await request.json());
  const item = await cartService.updateMyCartItemQuantity(
    auth.userId,
    params.cartItemId as string,
    body.quantity,
  );
  const completedAt = performance.now();

  logCartTiming(
    'update',
    correlationId,
    requestId,
    startedAt,
    authenticatedAt,
    rateLimitedAt,
    completedAt,
  );
  return jsonResource(item, { correlationId, rateLimit });
});

export const DELETE = withRouteHandler(async ({ request, correlationId, requestId, params }) => {
  const startedAt = performance.now();
  const auth = await authenticate(request);
  const authenticatedAt = performance.now();
  const rateLimit = await enforceRateLimit('standard', auth.userId);
  const rateLimitedAt = performance.now();

  await cartService.removeFromMyCart(auth.userId, params.cartItemId as string);
  const completedAt = performance.now();

  logCartTiming(
    'remove',
    correlationId,
    requestId,
    startedAt,
    authenticatedAt,
    rateLimitedAt,
    completedAt,
  );
  return jsonNoContent({ correlationId, rateLimit });
});
