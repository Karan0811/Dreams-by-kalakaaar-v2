import { NextRequest, NextResponse } from "next/server";
import {
  deleteCreatorProduct,
  fetchCreatorProduct,
  transitionCreatorProductStatus,
  updateCreatorProduct,
  ApiError,
} from "@dbk/api-client/server";
import type { UpdateProductPayload } from "@dbk/types";
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

function missingStoreId() {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message: "storeId is required.", correlationId: crypto.randomUUID() } },
    { status: 400 },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId } = await params;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return missingStoreId();

  try {
    const result = await fetchCreatorProduct(auth.accessToken, storeId, productId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId } = await params;
  const body = (await request.json()) as { storeId: string; status?: "ACTIVE" | "PAUSED" | "ARCHIVED" } & UpdateProductPayload;
  const { storeId, status, ...rest } = body;
  if (!storeId) return missingStoreId();

  try {
    const result = status
      ? await transitionCreatorProductStatus(auth.accessToken, storeId, productId, status)
      : await updateCreatorProduct(auth.accessToken, storeId, productId, rest);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId } = await params;
  const { storeId } = (await request.json()) as { storeId: string };
  if (!storeId) return missingStoreId();

  try {
    await deleteCreatorProduct(auth.accessToken, storeId, productId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
