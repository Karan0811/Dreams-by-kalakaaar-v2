import { NextRequest, NextResponse } from "next/server";
import { fetchMyNotifications } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function GET(request: NextRequest) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  try {
    const result = await fetchMyNotifications(auth.accessToken, {
      unreadOnly: searchParams.get("unreadOnly") === "true",
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
