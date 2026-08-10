import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { updateOrderStatusSchema } from '@/modules/orders/schemas';
import * as ordersService from '@/modules/orders/service';

/**
 * Admin-only Order status transition. Requires `orders:manage` — per
 * `shared/db/schema/orders.ts`'s documented assumption, order fulfillment
 * status is not split per-Store this sprint, so this is a platform-admin
 * action rather than something a Creator can do for their own items.
 */
export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await authorize(auth.userId, 'orders:manage');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateOrderStatusSchema.parse(await request.json());
  const order = await ordersService.transitionOrderStatus(
    params.orderId as string,
    auth.userId,
    body.status,
    body.note,
  );

  return jsonResource(order, { correlationId, rateLimit });
});
