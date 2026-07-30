import { NextResponse } from "next/server";
import { getServerSession } from "@dbk/auth/server";
import { fetchCart, ApiError } from "@dbk/api-client/server";

/**
 * Guest (unauthenticated) cart persistence is cookie/session-id based and is
 * intentionally out of scope for this sprint's shell — an unauthenticated
 * request gets a valid, empty cart shape so the UI never breaks, and this is
 * the seam where guest-cart support plugs in later.
 */
export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({
      data: { id: "guest", items: [], subtotal: { amountMinor: 0, currency: "INR" }, itemCount: 0 },
    });
  }

  try {
    const result = await fetchCart(session.id);
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
