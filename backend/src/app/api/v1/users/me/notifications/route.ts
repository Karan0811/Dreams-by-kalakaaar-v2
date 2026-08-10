import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { listNotificationsQuerySchema } from '@/modules/notifications/schemas';
import * as notificationsService from '@/modules/notifications/service';

export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const { searchParams } = new URL(request.url);
  const query = listNotificationsQuerySchema.parse(Object.fromEntries(searchParams));
  const result = await notificationsService.listMyNotifications(auth.userId, query);

  return jsonResource(result, { correlationId, rateLimit });
});
