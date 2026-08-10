import { NextRequest, NextResponse } from "next/server";
import { fetchCreatorAddresses, createCreatorAddress } from "@dbk/api-client/server";
import { requireCreatorAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function GET() {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;
  try {
    return NextResponse.json(await fetchCreatorAddresses(auth.accessToken));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

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
    const result = await createCreatorAddress(auth.accessToken, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
