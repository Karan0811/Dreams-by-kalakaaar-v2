import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { buildRefreshTokenCookie } from '@/shared/http/cookies';
import { loginSchema } from '@/modules/auth/schemas';
import * as authService from '@/modules/auth/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const body = loginSchema.parse(await request.json());

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  // Dual-keyed limiter (12-security-architecture.md Section 5.9): both the
  // IP and the targeted account are rate-limited independently so a
  // distributed credential-stuffing attempt against one account from many
  // IPs is still caught.
  const rateLimit = await enforceRateLimit('auth', `${ip}:${body.email}`);

  const result = await authService.login(body);

  const response = jsonResource(
    {
      id: result.user.id,
      email: result.user.email,
      accessToken: result.accessToken,
      accessTokenExpiresIn: 900,
    },
    { correlationId, rateLimit },
  );
  response.headers.append(
    'Set-Cookie',
    buildRefreshTokenCookie(result.refreshToken, result.refreshTokenExpiresAt),
  );
  return response;
});
