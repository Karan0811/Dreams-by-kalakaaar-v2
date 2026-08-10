import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { orderId } = await params;
  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  try {
    const result = await cancelOrder(auth.accessToken, orderId, body);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
