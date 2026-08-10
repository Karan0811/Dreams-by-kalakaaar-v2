import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { createCreatorDocumentSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const documents = await creatorsService.listMyDocuments(auth.userId);

  return jsonResource({ data: documents }, { correlationId, rateLimit });
});

/** Step 2 of the document upload flow — see `creator/documents/upload-url` for Step 1. */
export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = createCreatorDocumentSchema.parse(await request.json());
  const document = await creatorsService.createMyDocument(auth.userId, body);

  return jsonResource(document, { correlationId, rateLimit }, 201);
});
