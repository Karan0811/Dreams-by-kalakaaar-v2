import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { updateUserAddressSchema } from '@/modules/addresses/schemas';
import * as addressesService from '@/modules/addresses/service';

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateUserAddressSchema.parse(await request.json());
  const address = await addressesService.updateMyAddress(auth.userId, params.addressId as string, body);

  return jsonResource(address, { correlationId, rateLimit });
});

export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await addressesService.deleteMyAddress(auth.userId, params.addressId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
