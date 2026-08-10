import { NextRequest, NextResponse } from "next/server";
import { fetchProductVariants, createProductVariant } from "@dbk/api-client/server";
import type { CreateProductVariantPayload } from "@dbk/types";
import { requireCreatorAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

/** Same `storeId`-in-request convention as `app/api/products/route.ts` (existing Sprint 01 pattern — storeId is client-supplied, ownership is re-verified server-side by the backend regardless). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId } = await params;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "storeId is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await fetchProductVariants(auth.accessToken, storeId, productId));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId } = await params;
  const { storeId, ...payload } = (await request.json().catch(() => ({}))) as CreateProductVariantPayload & {
    storeId?: string;
  };
  if (!storeId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "storeId is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    const result = await createProductVariant(auth.accessToken, storeId, productId, payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
