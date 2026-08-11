import { NextRequest, NextResponse } from "next/server";

/**
 * Companion to `session/verify-email/route.ts` — see that file's doc
 * comment for why the verification flow needed to move off Better Auth's
 * own endpoints onto the backend's real ones. This proxies to the
 * backend's new `POST /v1/auth/resend-verification`.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  if (!body?.email) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "An email address is required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  const baseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: { code: "CONFIG_ERROR", message: "API_BASE_URL is not configured.", correlationId: crypto.randomUUID() } },
      { status: 500 },
    );
  }

  try {
    // No-enumeration by design (backend Service Layer never reveals
    // whether the email exists) — always relay a 204 on a successful
    // backend round trip, and only surface a real infrastructure failure.
    const backendResponse = await fetch(`${baseUrl}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email }),
    });
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: { code: "BRIDGE_FAILED", message: "Could not send a new verification email.", correlationId: crypto.randomUUID() } },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: { code: "BRIDGE_FAILED", message: "Could not reach the backend.", correlationId: crypto.randomUUID() } },
      { status: 502 },
    );
  }

  return new NextResponse(null, { status: 204 });
}