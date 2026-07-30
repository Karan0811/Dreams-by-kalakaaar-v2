import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorizeOwnerOrPermission } from '@/shared/middleware/authorize';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonCollection, jsonResource } from '@/shared/http/response';
import { createProductSchema, listProductsQuerySchema } from '@/modules/products/schemas';
import { StoreNotFoundError } from '@/modules/products/errors';
import * as productsService from '@/modules/products/service';

/**
 * Creator-side Product CRUD, scoped to one Store —
 * 09-api-architecture.md's nested-resource convention for
 * seller-management endpoints (as opposed to the flat, public
 * `/v1/products` read surface in `app/api/v1/products/route.ts`).
 */

export const POST = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;

  const ownerUserId = await productsService.getStoreOwnerUserId(storeId);
  if (!ownerUserId) throw new StoreNotFoundError();
  await authorizeOwnerOrPermission(auth.userId, {
    ownerId: ownerUserId,
    fallbackPermission: 'products:write',
    storeId,
  });

  const rateLimit = await enforceRateLimit('standard', auth.userId);
  const body = createProductSchema.parse(await request.json());
  const product = await productsService.createProduct(storeId, body);

  return jsonResource(product, { correlationId, rateLimit }, 201);
});

export const GET = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;

  const ownerUserId = await productsService.getStoreOwnerUserId(storeId);
  if (ownerUserId) {
    await authorizeOwnerOrPermission(auth.userId, {
      ownerId: ownerUserId,
      fallbackPermission: 'products:read',
      storeId,
    });
  }

  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const { searchParams } = new URL(request.url);
  const query = listProductsQuerySchema.parse(Object.fromEntries(searchParams));

  const result = await productsService.listStoreProducts(storeId, query);

  return jsonCollection(
    {
      data: result.data,
      pagination: { nextCursor: result.nextCursor, hasMore: result.hasMore, limit: query.limit },
    },
    { correlationId, rateLimit },
  );
});
