import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent } from '@/shared/http/response';
import { verifyEmailSchema } from '@/modules/auth/schemas';
import * as authService from '@/modules/auth/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('auth', ip);

  const body = verifyEmailSchema.parse(await request.json());
  await authService.verifyEmail(body.token);

  return jsonNoContent({ correlationId, rateLimit });
});
