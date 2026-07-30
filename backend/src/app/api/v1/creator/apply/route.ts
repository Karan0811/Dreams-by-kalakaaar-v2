import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { applyAsCreatorSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = applyAsCreatorSchema.parse(await request.json());
  const { creator, store } = await creatorsService.applyAsCreator(auth.userId, body);

  return jsonResource(
    {
      id: creator.id,
      onboardingStatus: creator.onboardingStatus,
      store: { id: store.id, name: store.name, slug: store.slug, status: store.status },
    },
    { correlationId, rateLimit },
    201,
  );
});
