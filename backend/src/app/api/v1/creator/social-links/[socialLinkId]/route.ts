import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { updateCreatorSocialLinkSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateCreatorSocialLinkSchema.parse(await request.json());
  const link = await creatorsService.updateMySocialLink(auth.userId, params.socialLinkId as string, body);

  return jsonResource(link, { correlationId, rateLimit });
});

export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await creatorsService.deleteMySocialLink(auth.userId, params.socialLinkId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
