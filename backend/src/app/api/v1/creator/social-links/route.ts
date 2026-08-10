import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { createCreatorSocialLinkSchema } from '@/modules/creators/schemas';
import * as creatorsService from '@/modules/creators/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const links = await creatorsService.listMySocialLinks(auth.userId);

  return jsonResource({ data: links }, { correlationId, rateLimit });
});

/** Upserts by platform — posting the same platform twice updates the existing link rather than erroring (see service.ts's `createMySocialLink`). */
export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = createCreatorSocialLinkSchema.parse(await request.json());
  const link = await creatorsService.createMySocialLink(auth.userId, body);

  return jsonResource(link, { correlationId, rateLimit }, 201);
});
