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
 * Places an order from the authenticated buyer's current cart. No payment
 * step this sprint (see `shared/db/schema/orders.ts`) — the order is
 * created directly in `PENDING`. The only client input is
 * `shippingAddressId`; `createOrder` re-validates the cart, prices every
 * line from the database, and computes the total entirely server-side.
 */
export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = createOrderSchema.parse(await request.json());
  const order = await ordersService.createOrder(auth.userId, body.shippingAddressId);

  return jsonResource(order, { correlationId, rateLimit }, 201);
});
