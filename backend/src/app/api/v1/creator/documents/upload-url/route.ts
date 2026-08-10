import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { requestCreatorDocumentUploadSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = requestCreatorDocumentUploadSchema.parse(await request.json());
  const result = await creatorsService.requestMyDocumentUpload(auth.userId, body);

  return jsonResource(result, { correlationId, rateLimit }, 201);
});
