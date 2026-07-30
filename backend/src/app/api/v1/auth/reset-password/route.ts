import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent } from '@/shared/http/response';
import { resetPasswordSchema } from '@/modules/auth/schemas';
import * as authService from '@/modules/auth/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('auth', ip);

  const body = resetPasswordSchema.parse(await request.json());
  await authService.resetPassword(body);

  return jsonNoContent({ correlationId, rateLimit });
});
