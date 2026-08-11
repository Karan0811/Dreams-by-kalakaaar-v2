import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { requestProductMediaUploadSchema } from '@/modules/products/schemas';
import { requireStoreProductOwnership } from '@/modules/products/authorization';
import * as productsService from '@/modules/products/service';

/**
 * Step 1 of Product Image upload — Sprint 01. Returns a short-lived
 * presigned R2 URL the client uploads the file bytes to directly; no image
 * data ever passes through this Route Handler
 * (`shared/storage/r2-client.ts`'s documented rationale).
 */
export const POST = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, params.productId as string, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = requestProductMediaUploadSchema.parse(await request.json());
  const result = await productsService.requestProductMediaUpload(
    params.productId as string,
    auth.userId,
    body,
  );

  return jsonResource(result, { correlationId, rateLimit }, 201);
});
