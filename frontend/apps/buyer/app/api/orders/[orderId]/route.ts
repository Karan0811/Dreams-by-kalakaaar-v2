import { NextResponse } from "next/server";
import { fetchMyOrder } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { orderId } = await params;
  try {
    return NextResponse.json(await fetchMyOrder(auth.accessToken, orderId));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
