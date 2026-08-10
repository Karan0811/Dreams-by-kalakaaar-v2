import { NextRequest, NextResponse } from "next/server";
import { updateCategory, deleteCategory } from "@dbk/api-client/server";
import { requireCreatorAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { categoryId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await updateCategory(auth.accessToken, categoryId, body));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { categoryId } = await params;
  try {
    await deleteCategory(auth.accessToken, categoryId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
