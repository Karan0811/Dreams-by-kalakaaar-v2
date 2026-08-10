import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { addWishlistItemSchema } from '@/modules/wishlist/schemas';
import * as wishlistService from '@/modules/wishlist/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const items = await wishlistService.listMyWishlist(auth.userId);

  return jsonResource({ data: items }, { correlationId, rateLimit });
});

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = addWishlistItemSchema.parse(await request.json());
  const item = await wishlistService.addToMyWishlist(auth.userId, body.productId);

  return jsonResource(item, { correlationId, rateLimit }, 201);
});
