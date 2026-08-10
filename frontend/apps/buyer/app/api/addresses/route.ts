import { NextRequest, NextResponse } from "next/server";
import { fetchMyAddresses, createMyAddress } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function GET() {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;
  try {
    return NextResponse.json(await fetchMyAddresses(auth.accessToken));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    const result = await createMyAddress(auth.accessToken, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
