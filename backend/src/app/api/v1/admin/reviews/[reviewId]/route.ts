import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent } from '@/shared/http/response';
import * as reviewsService from '@/modules/reviews/service';

/** Admin moderation delete — requires `reviews:moderate`. */
export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await authorize(auth.userId, 'reviews:moderate');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await reviewsService.moderateDeleteReview(params.reviewId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
