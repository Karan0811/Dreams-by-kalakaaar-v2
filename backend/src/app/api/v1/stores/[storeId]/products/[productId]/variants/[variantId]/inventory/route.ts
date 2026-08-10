import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { adjustInventorySchema } from '@/modules/products/schemas';
import { requireStoreProductOwnership } from '@/modules/products/authorization';
import * as productsService from '@/modules/products/service';

/** Sprint 02 — Inventory read (the CRUD's "R"; PATCH below covers create-via-variant-creation and update). */
export const GET = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, 'products:read');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const inventoryRow = await productsService.getVariantInventory(
    params.productId as string,
    params.variantId as string,
  );

  return jsonResource(inventoryRow, { correlationId, rateLimit });
});

/**
 * Inventory Management — Sprint 01. Always a signed delta, never a raw
 * overwrite (`modules/products/schemas.ts`'s `adjustInventorySchema` doc
 * comment) — floors at zero rather than going negative.
 */
export const PATCH = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const storeId = params.storeId as string;
  await requireStoreProductOwnership(auth.userId, storeId, 'products:write');
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const body = adjustInventorySchema.parse(await request.json());
  const inventoryRow = await productsService.adjustVariantInventory(
    params.productId as string,
    params.variantId as string,
    body,
  );

  return jsonResource(inventoryRow, { correlationId, rateLimit });
});
