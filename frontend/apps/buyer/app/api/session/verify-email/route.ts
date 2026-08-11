import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@dbk/api-client/server";

/**
 * Verifies an email using a token from the verification email.
 * Calls the backend's verify-email endpoint.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  if (!body?.token) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "token is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    await apiFetch("/auth/verify-email", {
      method: "POST",
      body: { token: body.token },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Forward the backend error response
    if (error instanceof Error && "status" in error) {
      const apiError = error as { status: number; message?: string };
      return NextResponse.json(
        { error: { code: apiError.status === 401 ? "INVALID_TOKEN" : "VERIFICATION_FAILED", message: apiError.message || "Verification failed", correlationId: crypto.randomUUID() } },
        { status: apiError.status >= 500 ? 500 : 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "VERIFICATION_FAILED", message: "Could not verify email.", correlationId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
