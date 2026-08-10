import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent } from '@/shared/http/response';
import * as notificationsService from '@/modules/notifications/service';

export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await notificationsService.markAllMyNotificationsRead(auth.userId);

  return jsonNoContent({ correlationId, rateLimit });
});
