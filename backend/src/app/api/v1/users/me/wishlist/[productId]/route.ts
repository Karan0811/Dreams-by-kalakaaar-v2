import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent } from '@/shared/http/response';
import * as wishlistService from '@/modules/wishlist/service';

export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await wishlistService.removeFromMyWishlist(auth.userId, params.productId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
