import { NextRequest, NextResponse } from "next/server";
import { updateMyAddress, deleteMyAddress } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ addressId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { addressId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    const result = await updateMyAddress(auth.accessToken, addressId, body);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ addressId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { addressId } = await params;
  try {
    await deleteMyAddress(auth.accessToken, addressId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
