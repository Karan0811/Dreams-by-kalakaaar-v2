import { NextRequest, NextResponse } from "next/server";
import { adjustCreatorVariantInventory, ApiError } from "@dbk/api-client/server";
import type { AdjustInventoryPayload } from "@dbk/types";
import { requireCreatorAccessToken } from "@/lib/api-auth";

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
