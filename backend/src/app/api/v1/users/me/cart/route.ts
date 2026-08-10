import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { addCartItemSchema } from '@/modules/cart/schemas';
import * as cartService from '@/modules/cart/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const cart = await cartService.getMyCart(auth.userId);

  return jsonResource(cart, { correlationId, rateLimit });
});

/** Adding a variant already in the cart merges quantities rather than creating a duplicate row (see `service.ts`'s `addToMyCart`). */
export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = addCartItemSchema.parse(await request.json());
  const item = await cartService.addToMyCart(auth.userId, body.variantId, body.quantity);

  return jsonResource(item, { correlationId, rateLimit }, 201);
});
