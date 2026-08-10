import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { updateCreatorBankDetailsSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateCreatorBankDetailsSchema.parse(await request.json());
  const bankDetail = await creatorsService.updateMyBankDetail(
    auth.userId,
    params.bankDetailId as string,
    body,
  );

  return jsonResource(bankDetail, { correlationId, rateLimit });
});

export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await creatorsService.deleteMyBankDetail(auth.userId, params.bankDetailId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
