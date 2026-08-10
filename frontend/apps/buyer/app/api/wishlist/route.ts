import { NextRequest, NextResponse } from "next/server";
import { fetchWishlist, addWishlistItem } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function GET() {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;
  try {
    return NextResponse.json(await fetchWishlist(auth.accessToken));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const body = (await request.json().catch(() => null)) as { productId?: string } | null;
  if (!body?.productId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "productId is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    const result = await addWishlistItem(auth.accessToken, body.productId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
