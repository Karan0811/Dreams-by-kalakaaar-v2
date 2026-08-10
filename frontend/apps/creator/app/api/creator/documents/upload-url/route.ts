import { NextRequest, NextResponse } from "next/server";
import { requestCreatorDocumentUpload } from "@dbk/api-client/server";
import { requireCreatorAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function POST(request: NextRequest) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    const result = await requestCreatorDocumentUpload(auth.accessToken, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
