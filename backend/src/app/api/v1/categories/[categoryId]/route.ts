import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonNoContent, jsonResource } from '@/shared/http/response';
import { updateCategorySchema } from '@/modules/categories/schemas';
import * as categoriesService from '@/modules/categories/service';

export const GET = withRouteHandler(async ({ request, correlationId, params }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('public', ip);

  const category = await categoriesService.getCategory(params.categoryId as string);

  return jsonResource(category, { correlationId, rateLimit });
});

export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await authorize(auth.userId, 'categories:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = updateCategorySchema.parse(await request.json());
  const category = await categoriesService.updateCategory(params.categoryId as string, body);

  return jsonResource(category, { correlationId, rateLimit });
});

export const DELETE = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await authorize(auth.userId, 'categories:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  await categoriesService.deleteCategory(params.categoryId as string);

  return jsonNoContent({ correlationId, rateLimit });
});
