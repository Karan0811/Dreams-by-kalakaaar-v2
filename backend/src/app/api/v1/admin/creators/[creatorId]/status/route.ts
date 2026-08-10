import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { creatorStatusTransitionSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

/**
 * Admin-only Creator status transition (approve/reject/suspend/reactivate/close).
 * Requires the platform-scoped `creators:review` permission — this is
 * deliberately not an owner-or-permission check (a Creator can never
 * approve or suspend themselves).
 */
export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await authorize(auth.userId, 'creators:review');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = creatorStatusTransitionSchema.parse(await request.json());
  const creator = await creatorsService.transitionCreatorStatus(
    params.creatorId as string,
    body.onboardingStatus,
  );

  return jsonResource(
    { id: creator.id, onboardingStatus: creator.onboardingStatus, updatedAt: creator.updatedAt },
    { correlationId, rateLimit },
  );
});
