import { NextRequest, NextResponse } from "next/server";
import { deleteCreatorDocument } from "@dbk/api-client/server";
import { requireCreatorAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { documentId } = await params;
  try {
    await deleteCreatorDocument(auth.accessToken, documentId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
