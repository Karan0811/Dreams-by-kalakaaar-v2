import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { buildRefreshTokenCookie } from '@/shared/http/cookies';
import { registerSchema } from '@/modules/auth/schemas';
import * as authService from '@/modules/auth/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('auth', ip);

  const body = registerSchema.parse(await request.json());
  const result = await authService.register(body);

  const response = jsonResource(
    {
      id: result.user.id,
      email: result.user.email,
      displayName: body.displayName,
      accessToken: result.accessToken,
      accessTokenExpiresIn: 900,
    },
    { correlationId, rateLimit },
    201,
  );
  response.headers.append(
    'Set-Cookie',
    buildRefreshTokenCookie(result.refreshToken, result.refreshTokenExpiresAt),
  );
  return response;
});
