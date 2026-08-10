import { NextResponse } from "next/server";
import { markNotificationRead } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function POST(_request: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { notificationId } = await params;
  try {
    const result = await markNotificationRead(auth.accessToken, notificationId);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
