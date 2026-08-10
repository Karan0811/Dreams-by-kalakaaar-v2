import { NextRequest, NextResponse } from "next/server";
import { updateCartItem, removeCartItem } from "@dbk/api-client/server";
import { updateCartItemSchema } from "@dbk/utils";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ cartItemId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { cartItemId } = await params;
  const rawBody: unknown = await request.json().catch(() => null);
  const parsed = updateCartItemSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body.",
          details: parsed.error.flatten().fieldErrors,
          correlationId: crypto.randomUUID(),
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await updateCartItem(auth.accessToken, cartItemId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ cartItemId: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { cartItemId } = await params;
  try {
    await removeCartItem(auth.accessToken, cartItemId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
