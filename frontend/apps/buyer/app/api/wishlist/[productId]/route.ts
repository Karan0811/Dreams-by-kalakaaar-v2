import { NextRequest, NextResponse } from "next/server";
import { removeWishlistItem } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { productId } = await params;
  try {
    await removeWishlistItem(auth.accessToken, productId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
