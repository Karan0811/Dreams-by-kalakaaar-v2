import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { createUserAddressSchema } from '@/modules/addresses/schemas';
import * as addressesService from '@/modules/addresses/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const addresses = await addressesService.listMyAddresses(auth.userId);

  return jsonResource({ data: addresses }, { correlationId, rateLimit });
});

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = createUserAddressSchema.parse(await request.json());
  const address = await addressesService.createMyAddress(auth.userId, body);

  return jsonResource(address, { correlationId, rateLimit }, 201);
});
