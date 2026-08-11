import { NextRequest, NextResponse } from "next/server";

/**
 * FIX (Q8 — verification-state desync): `VerifyEmailPanel.tsx` used to call
 * Better Auth's own `/api/auth/verify-email`, which only understands
 * Better-Auth-native tokens minted into this app's own, separate
 * `verification` table. The actual verification email a signed-up user
 * receives is sent by the backend's `register()` (`modules/auth/service.ts`)
 * with the backend's own token, pointing at this app's `/verify-email` page
 * — so that link's token was never something Better Auth's endpoint could
 * recognize, and verification silently always failed from the user's
 * perspective. This route calls the backend's actual, working
 * `POST /v1/auth/verify-email` instead.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  if (!body?.token) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "A verification token is required.", correlationId: crypto.randomUUID() } },
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

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${baseUrl}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: body.token }),
    });
  } catch {
    return NextResponse.json(
      { error: { code: "BRIDGE_FAILED", message: "Could not reach the backend.", correlationId: crypto.randomUUID() } },
      { status: 502 },
    );
  }

  if (!backendResponse.ok) {
    // Backend reports a single AUTHENTICATION_ERROR for both invalid and
    // expired tokens (`InvalidOrExpiredTokenError`) — relay its actual
    // status rather than guessing at a distinction it doesn't make.
    const errorBody = (await backendResponse.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } }
      | null;
    return NextResponse.json(
      {
        error: {
          code: errorBody?.error?.code ?? "VERIFICATION_FAILED",
          message: errorBody?.error?.message ?? "This verification link is invalid or has expired.",
          correlationId: crypto.randomUUID(),
        },
      },
      { status: backendResponse.status },
    );
  }

  return new NextResponse(null, { status: 204 });
}