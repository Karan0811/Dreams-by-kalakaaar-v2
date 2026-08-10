import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import * as ordersService from '@/modules/orders/service';

export const GET = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const order = await ordersService.getMyOrder(auth.userId, params.orderId as string);

  return jsonResource(order, { correlationId, rateLimit });
});
