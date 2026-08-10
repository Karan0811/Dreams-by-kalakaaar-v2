import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { updateReviewSchema } from '@/modules/reviews/schemas';
import * as reviewsService from '@/modules/reviews/service';

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateReviewSchema.parse(await request.json());
  const review = await reviewsService.updateMyReview(auth.userId, params.reviewId as string, body);

  return jsonResource(review, { correlationId, rateLimit });
});

export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await reviewsService.deleteMyReview(auth.userId, params.reviewId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
