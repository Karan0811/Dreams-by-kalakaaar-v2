import { withRouteHandler } from '@/shared/middleware/compose';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent } from '@/shared/http/response';
import { resendVerificationSchema } from '@/modules/auth/schemas';
import * as authService from '@/modules/auth/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('auth', ip);

  const body = resendVerificationSchema.parse(await request.json());
  await authService.resendVerificationEmail(body.email);

  // Always 204 regardless of whether the email exists or is already
  // verified (Service Layer enforces the no-enumeration behavior) — see
  // modules/auth/service.ts's resendVerificationEmail.
  return jsonNoContent({ correlationId, rateLimit });
});