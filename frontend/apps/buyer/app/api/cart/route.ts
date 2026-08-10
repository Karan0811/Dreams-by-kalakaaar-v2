import { NextResponse } from "next/server";
import { fetchCart } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function GET() {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const cart = await fetchCart(auth.accessToken);
    return NextResponse.json(cart);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
