import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import * as notificationsService from '@/modules/notifications/service';

export const POST = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const notification = await notificationsService.markMyNotificationRead(
    auth.userId,
    params.notificationId as string,
  );

  return jsonResource(notification, { correlationId, rateLimit });
});
