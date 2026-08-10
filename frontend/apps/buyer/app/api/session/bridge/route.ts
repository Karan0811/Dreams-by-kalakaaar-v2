import { NextRequest, NextResponse } from "next/server";
import { bridgeBackendSession } from "@dbk/auth/server";

/**
 * Bridges this app's Better Auth session to the backend's own JWT auth —
 * see `@dbk/auth`'s `access-token.ts` doc comment for the full rationale.
 * Called client-side right after a successful `signIn.email`/`signUp.email`
 * (see `LoginForm.tsx`/`SignupForm.tsx`), with the same credentials the
 * person just typed — never persisted, used once here and discarded.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "email and password are required.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  const bridged = await bridgeBackendSession(body.email, body.password);
  if (!bridged) {
    return NextResponse.json(
      { error: { code: "BRIDGE_FAILED", message: "Could not establish a backend session.", correlationId: crypto.randomUUID() } },
      { status: 502 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
