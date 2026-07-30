import { NextResponse } from "next/server";
import { getServerSession } from "@dbk/auth/server";
import { fetchCreatorPendingActions, ApiError } from "@dbk/api-client/server";

export async function GET() {
  const session = await getServerSession();
  if (!session || !session.roles.includes("creator")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You don't have permission to do that.", correlationId: crypto.randomUUID() } },
      { status: 403 },
    );
  }

  try {
    const result = await fetchCreatorPendingActions(session.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, correlationId: error.correlationId } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong.", correlationId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
