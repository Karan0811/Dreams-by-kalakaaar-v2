import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { createCreatorBankDetailsSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const bankDetails = await creatorsService.listMyBankDetails(auth.userId);

  return jsonResource({ data: bankDetails }, { correlationId, rateLimit });
});

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = createCreatorBankDetailsSchema.parse(await request.json());
  const bankDetail = await creatorsService.createMyBankDetail(auth.userId, body);

  return jsonResource(bankDetail, { correlationId, rateLimit }, 201);
});
