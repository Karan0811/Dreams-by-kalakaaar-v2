import { NextRequest, NextResponse } from "next/server";
import { fetchMyOrders, createOrder } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function GET(request: NextRequest) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  try {
    const result = await fetchMyOrders(auth.accessToken, {
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const body = (await request.json().catch(() => null)) as { shippingAddressId?: string } | null;
  if (!body?.shippingAddressId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "shippingAddressId is required.",
          correlationId: crypto.randomUUID(),
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await createOrder(auth.accessToken, body as { shippingAddressId: string });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
