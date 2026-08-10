import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { updateCreatorAddressSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateCreatorAddressSchema.parse(await request.json());
  const address = await creatorsService.updateMyAddress(auth.userId, params.addressId as string, body);

  return jsonResource(address, { correlationId, rateLimit });
});

export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await creatorsService.deleteMyAddress(auth.userId, params.addressId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
