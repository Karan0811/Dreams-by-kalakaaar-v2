import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { cancelOrderSchema } from '@/modules/orders/schemas';
import * as ordersService from '@/modules/orders/service';

export const POST = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = cancelOrderSchema.parse(await request.json());
  const order = await ordersService.cancelMyOrder(auth.userId, params.orderId as string, body.reason);

  return jsonResource(order, { correlationId, rateLimit });
});
