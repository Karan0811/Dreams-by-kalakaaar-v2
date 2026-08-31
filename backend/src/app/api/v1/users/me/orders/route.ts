import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { createOrderSchema, listMyOrdersQuerySchema } from '@/modules/orders/schemas';
import * as ordersService from '@/modules/orders/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const { searchParams } = new URL(request.url);
  const query = listMyOrdersQuerySchema.parse(Object.fromEntries(searchParams));
  const myOrders = await ordersService.listMyOrders(auth.userId, query);

  return jsonResource({ data: myOrders }, { correlationId, rateLimit });
});

/**
 * Reserved checkout endpoint. Until payment creation and verification are
 * implemented, it returns a typed 402 and makes no database changes.
 */
export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = createOrderSchema.parse(await request.json());
  const order = await ordersService.createOrder(auth.userId, body.shippingAddressId);

  return jsonResource(order, { correlationId, rateLimit }, 201);
});
