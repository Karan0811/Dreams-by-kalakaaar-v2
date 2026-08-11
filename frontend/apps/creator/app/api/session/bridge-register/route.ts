import { NextRequest, NextResponse } from "next/server";
import { bridgeBackendRegistration } from "@dbk/auth/server";

/**
 * Sign-up counterpart to `/api/session/bridge` — see
 * `bridgeBackendRegistration`'s doc comment in `@dbk/auth` for why sign-up
 * needs its own backend registration call rather than a login call.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; displayName?: string }
    | null;
  if (!body?.email || !body?.password || !body?.displayName) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "email, password, and displayName are required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  const bridged = await bridgeBackendRegistration(body.email, body.password, body.displayName);
  if (!bridged.ok) {
    return NextResponse.json(
      { error: { code: "BRIDGE_FAILED", message: bridged.reason, correlationId: crypto.randomUUID() } },
      { status: 502 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
