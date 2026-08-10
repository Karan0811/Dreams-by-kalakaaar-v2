import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { updateCartItemSchema } from '@/modules/cart/schemas';
import * as cartService from '@/modules/cart/service';

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateCartItemSchema.parse(await request.json());
  const item = await cartService.updateMyCartItemQuantity(
    auth.userId,
    params.cartItemId as string,
    body.quantity,
  );

  return jsonResource(item, { correlationId, rateLimit });
});

export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await cartService.removeFromMyCart(auth.userId, params.cartItemId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
