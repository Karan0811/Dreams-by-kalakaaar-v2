import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@dbk/api-client/server";

/**
 * Resends a verification email to the user.
 * Calls the backend's resend-verification endpoint.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  if (!body?.email) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "email is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    await apiFetch("/auth/resend-verification", {
      method: "POST",
      body: { email: body.email },
    });
    // Always return success to prevent account enumeration
    return new NextResponse(null, { status: 204 });
  } catch {
    // Return success even on error to prevent account enumeration
    // (as per security best practices)
    return new NextResponse(null, { status: 204 });
  }
}
