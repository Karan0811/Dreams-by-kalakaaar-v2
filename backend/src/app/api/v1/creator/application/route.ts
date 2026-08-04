import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import * as creatorsService from '@/modules/creators/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const { creator, store } = await creatorsService.getMyApplication(auth.userId);

  return jsonResource(
    {
      id: creator.id,
      legalName: creator.legalName,
      businessName: creator.businessName,
      category: creator.category,
      onboardingStatus: creator.onboardingStatus,
      approvedAt: creator.approvedAt,
      createdAt: creator.createdAt,
      // Sprint 01: needed by the frontend to call the creator-scoped
      // Products routes (/v1/stores/{storeId}/products/...).
      storeId: store?.id ?? null,
      storeSlug: store?.slug ?? null,
      storeStatus: store?.status ?? null,
    },
    { correlationId, rateLimit },
  );
});
