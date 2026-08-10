import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { setCategoryParentSchema } from '@/modules/categories/schemas';
import * as categoriesService from '@/modules/categories/service';

/** Sets or clears a Category's parent — e.g. converting a top-level Category into a Subcategory of another, or promoting a Subcategory back to top-level. */
export const PUT = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  await authorize(auth.userId, 'categories:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = setCategoryParentSchema.parse(await request.json());
  const category = await categoriesService.setCategoryParent(params.categoryId as string, body.parentId);

  return jsonResource(category, { correlationId, rateLimit });
});
