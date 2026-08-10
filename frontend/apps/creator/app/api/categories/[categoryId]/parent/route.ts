import { NextRequest, NextResponse } from "next/server";
import { setCategoryParent } from "@dbk/api-client/server";
import { requireCreatorAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { categoryId } = await params;
  const body = (await request.json().catch(() => null)) as { parentId: string | null } | null;
  if (!body || !("parentId" in body)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "parentId is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await setCategoryParent(auth.accessToken, categoryId, body.parentId));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
