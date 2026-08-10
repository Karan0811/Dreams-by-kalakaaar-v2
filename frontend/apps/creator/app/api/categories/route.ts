import { NextRequest, NextResponse } from "next/server";
import { fetchCategories, createCategory } from "@dbk/api-client/server";
import { requireCreatorAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

/**
 * Categories admin lives in the Creator app (no separate admin app exists
 * in this project — see frontend/apps). GET is genuinely unauthenticated
 * upstream, but this route still requires a signed-in Creator so the
 * category-management UI (create/edit/delete) isn't exposed to anonymous
 * visitors; the mutating verbs additionally depend on the caller holding
 * the backend's `categories:write` permission, enforced upstream and
 * surfaced here as a normal 403 `ApiError` if it's missing.
 */
export async function GET(request: NextRequest) {
  const auth = await requireCreatorAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  try {
    const result = await fetchCategories({
      parentId: searchParams.get("parentId") ?? undefined,
      flat: searchParams.get("flat") === "true",
    });
    return NextResponse.json(result);
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
    const result = await createCategory(auth.accessToken, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
