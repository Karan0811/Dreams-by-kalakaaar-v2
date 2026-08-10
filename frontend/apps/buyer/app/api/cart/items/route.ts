import { NextRequest, NextResponse } from "next/server";
import { addCartItem } from "@dbk/api-client/server";
import { addCartItemSchema } from "@dbk/utils";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function POST(request: NextRequest) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const rawBody: unknown = await request.json().catch(() => null);
  const parsed = addCartItemSchema.safeParse(rawBody);
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
    const result = await addCartItem(auth.accessToken, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
