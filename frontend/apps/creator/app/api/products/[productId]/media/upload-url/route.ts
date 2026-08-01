import { NextRequest, NextResponse } from "next/server";
import { requestCreatorProductMediaUpload, ApiError } from "@dbk/api-client/server";
import type { RequestMediaUploadPayload } from "@dbk/types";
import { requireCreatorAccessToken } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId } = await params;
  const { storeId, ...payload } = (await request.json()) as RequestMediaUploadPayload & { storeId: string };

  try {
    const result = await requestCreatorProductMediaUpload(auth.accessToken, storeId, productId, payload);
    return NextResponse.json(result, { status: 201 });
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
