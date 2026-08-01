import { NextRequest, NextResponse } from "next/server";
import { createCreatorProduct, fetchCreatorProducts, ApiError } from "@dbk/api-client/server";
import type { CreateProductPayload, CreatorProductListParams } from "@dbk/types";
import { requireCreatorAccessToken } from "@/lib/api-auth";

function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details, correlationId: error.correlationId } },
      { status: error.status },
    );
  }
  return NextResponse.json(
    { error: { code: "SERVER_ERROR", message: "Something went wrong.", correlationId: crypto.randomUUID() } },
    { status: 500 },
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const sp = request.nextUrl.searchParams;
  const storeId = sp.get("storeId");
  if (!storeId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "storeId is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  const page = sp.get("page");
  const params: CreatorProductListParams = {
    status: (sp.get("status") as CreatorProductListParams["status"]) ?? undefined,
    q: sp.get("q") ?? undefined,
    sort: (sp.get("sort") as CreatorProductListParams["sort"]) ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    page: page ? Number(page) : undefined,
  };

  try {
    const result = await fetchCreatorProducts(auth.accessToken, storeId, params);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { storeId, ...payload } = (await request.json()) as CreateProductPayload & { storeId: string };

  try {
    const result = await createCreatorProduct(auth.accessToken, storeId, payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
