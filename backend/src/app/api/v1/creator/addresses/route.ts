import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { createCreatorAddressSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const addresses = await creatorsService.listMyAddresses(auth.userId);

  return jsonResource({ data: addresses }, { correlationId, rateLimit });
});

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = createCreatorAddressSchema.parse(await request.json());
  const address = await creatorsService.createMyAddress(auth.userId, body);

  return jsonResource(address, { correlationId, rateLimit }, 201);
});
