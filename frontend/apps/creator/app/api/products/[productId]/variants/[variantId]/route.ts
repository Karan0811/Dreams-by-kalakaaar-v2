import { NextRequest, NextResponse } from "next/server";
import { updateProductVariant, archiveProductVariant } from "@dbk/api-client/server";
import type { UpdateProductVariantPayload } from "@dbk/types";
import { requireCreatorAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; variantId: string }> },
) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId, variantId } = await params;
  const { storeId, ...payload } = (await request.json().catch(() => ({}))) as UpdateProductVariantPayload & {
    storeId?: string;
  };
  if (!storeId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "storeId is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await updateProductVariant(auth.accessToken, storeId, productId, variantId, payload));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Archives (not a hard delete) — see `modules/products/repository.ts`'s `archiveProductVariant` on the backend. `storeId` arrives via query string since DELETE requests conventionally carry no body. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; variantId: string }> },
) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId, variantId } = await params;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "storeId is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await archiveProductVariant(auth.accessToken, storeId, productId, variantId));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
