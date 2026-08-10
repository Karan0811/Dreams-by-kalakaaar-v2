import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { updateCreatorProfileSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

/** Update the caller's own Creator profile (legal name, business name, tax ID, category). */
export const PATCH = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateCreatorProfileSchema.parse(await request.json());
  const creator = await creatorsService.updateMyProfile(auth.userId, body);

  return jsonResource(
    {
      id: creator.id,
      legalName: creator.legalName,
      businessName: creator.businessName,
      category: creator.category,
      onboardingStatus: creator.onboardingStatus,
      updatedAt: creator.updatedAt,
    },
    { correlationId, rateLimit },
  );
});
