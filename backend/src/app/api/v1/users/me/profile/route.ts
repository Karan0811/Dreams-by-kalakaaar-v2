import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { updateProfileSchema } from '@/modules/users/schemas';
import * as usersService from '@/modules/users/service';

/**
 * GET/PATCH /v1/users/me/profile — 09-api-architecture.md's Users domain.
 * "Me" endpoints authenticate the caller and never accept an ID in the
 * path, per Section 4's documented rationale for the `/me` convention.
 */

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const profile = await usersService.getMyProfile(auth.userId);

  return jsonResource(profile, { correlationId, rateLimit });
});

export const PATCH = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateProfileSchema.parse(await request.json());
  const profile = await usersService.updateMyProfile(auth.userId, body);

  return jsonResource(profile, { correlationId, rateLimit });
});
