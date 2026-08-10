import { NextResponse } from "next/server";
import { deleteNotification } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function DELETE(_request: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { notificationId } = await params;
  try {
    await deleteNotification(auth.accessToken, notificationId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
