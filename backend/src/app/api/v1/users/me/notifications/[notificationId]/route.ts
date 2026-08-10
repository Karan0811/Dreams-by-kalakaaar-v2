import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent } from '@/shared/http/response';
import * as notificationsService from '@/modules/notifications/service';

export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await notificationsService.deleteMyNotification(auth.userId, params.notificationId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
