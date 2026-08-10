import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function POST() {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    await markAllNotificationsRead(auth.accessToken);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
