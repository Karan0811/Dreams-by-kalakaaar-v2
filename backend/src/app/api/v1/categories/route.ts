import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { createCategorySchema, listCategoriesQuerySchema } from '@/modules/categories/schemas';
import * as categoriesService from '@/modules/categories/service';

/** Public — no authentication required, matching Products' public listing. */
export const GET = withRouteHandler(async ({ request, correlationId }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('public', ip);

  const { searchParams } = new URL(request.url);
  const query = listCategoriesQuerySchema.parse(Object.fromEntries(searchParams));
  const categories = await categoriesService.listCategories(query);

  return jsonResource({ data: categories }, { correlationId, rateLimit });
});

/** Admin-only — requires `categories:write`. */
export const POST = withRouteHandler(async ({ request, correlationId }) => {
  const auth = await authenticate(request);
  await authorize(auth.userId, 'categories:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = createCategorySchema.parse(await request.json());
  const category = await categoriesService.createCategory(body);

  return jsonResource(category, { correlationId, rateLimit }, 201);
});
