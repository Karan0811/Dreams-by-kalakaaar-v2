import { NextRequest, NextResponse } from "next/server";
import { deleteCreatorProductMedia, ApiError } from "@dbk/api-client/server";
import { requireCreatorAccessToken } from "@/lib/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; productMediaId: string }> },
) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId, productMediaId } = await params;
  const { storeId } = (await request.json()) as { storeId: string };

  try {
    await deleteCreatorProductMedia(auth.accessToken, storeId, productId, productMediaId);
    return new NextResponse(null, { status: 204 });
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
