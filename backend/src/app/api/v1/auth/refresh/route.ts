import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { buildRefreshTokenCookie } from '@/shared/http/cookies';
import { readRefreshTokenCookie } from '@/shared/http/cookies';
import { AuthenticationError } from '@/shared/errors/base-errors';
import * as authService from '@/modules/auth/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const refreshToken = readRefreshTokenCookie(request);
  if (!refreshToken) {
    throw new AuthenticationError('No refresh token cookie present.');
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('auth', ip);

  const result = await authService.refresh(refreshToken);

  const response = jsonResource(
    { accessToken: result.accessToken, accessTokenExpiresIn: 900 },
    { correlationId, rateLimit },
  );
  response.headers.append(
    'Set-Cookie',
    buildRefreshTokenCookie(result.refreshToken, result.refreshTokenExpiresAt),
  );
  return response;
});
