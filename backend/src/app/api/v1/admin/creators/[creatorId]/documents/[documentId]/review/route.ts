import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { reviewCreatorDocumentSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const POST = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await authorize(auth.userId, 'creators:review');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = reviewCreatorDocumentSchema.parse(await request.json());
  const document = await creatorsService.reviewDocument(auth.userId, params.documentId as string, body);

  return jsonResource(document, { correlationId, rateLimit });
});
