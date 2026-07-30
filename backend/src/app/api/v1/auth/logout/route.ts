import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticateOptional } from '@/shared/middleware/authenticate';
import { jsonNoContent } from '@/shared/http/response';
import { buildClearedRefreshTokenCookie, readRefreshTokenCookie } from '@/shared/http/cookies';
import * as authService from '@/modules/auth/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const refreshToken = readRefreshTokenCookie(request);
  const auth = await authenticateOptional(request);

  if (refreshToken) {
    await authService.logout(refreshToken, auth?.sessionId);
  }

  const response = jsonNoContent({ correlationId });
  response.headers.append('Set-Cookie', buildClearedRefreshTokenCookie());
  return response;
});
