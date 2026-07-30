import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent } from '@/shared/http/response';
import { forgotPasswordSchema } from '@/modules/auth/schemas';
import * as authService from '@/modules/auth/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('auth', ip);

  const body = forgotPasswordSchema.parse(await request.json());
  await authService.forgotPassword(body.email, ip);

  // Always 204 regardless of whether the email exists (Service Layer
  // enforces the no-enumeration behavior) — see modules/auth/service.ts.
  return jsonNoContent({ correlationId, rateLimit });
});
