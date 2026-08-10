import { NextRequest, NextResponse } from "next/server";
import { adjustCreatorVariantInventory, fetchVariantInventory, ApiError } from "@dbk/api-client/server";
import type { AdjustInventoryPayload } from "@dbk/types";
import { requireCreatorAccessToken } from "@/lib/api-auth";

/** Sprint 02 — the CRUD's missing "R" (create/update already existed via variant creation and the PATCH below). */
export async function GET(
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
    const result = await fetchVariantInventory(auth.accessToken, storeId, productId, variantId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, correlationId: error.correlationId } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong.", correlationId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; variantId: string }> },
) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId, variantId } = await params;
  const { storeId, ...payload } = (await request.json()) as AdjustInventoryPayload & { storeId: string };

  try {
    await adjustCreatorVariantInventory(auth.accessToken, storeId, productId, variantId, payload);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, correlationId: error.correlationId } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong.", correlationId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
