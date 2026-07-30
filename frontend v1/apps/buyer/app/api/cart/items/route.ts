import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@dbk/auth/server";
import { addCartItem, ApiError } from "@dbk/api-client/server";
import { addCartItemSchema } from "@dbk/utils";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Please sign in to continue.", correlationId: crypto.randomUUID() } },
      { status: 401 },
    );
  }

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
    const result = await addCartItem(session.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details, correlationId: error.correlationId } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong.", correlationId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
