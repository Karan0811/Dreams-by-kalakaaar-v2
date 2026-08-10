import { NextRequest, NextResponse } from "next/server";
import { updateReview, deleteReview } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { reviewId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    const result = await updateReview(auth.accessToken, reviewId, body);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { reviewId } = await params;
  try {
    await deleteReview(auth.accessToken, reviewId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
