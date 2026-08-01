import { NextResponse } from "next/server";
import { getServerSession, getBackendAccessToken } from "@dbk/auth/server";

/**
 * Every creator Products BFF route needs the same three checks: a valid
 * session, the `creator` role, and a backend-compatible access token. The
 * third one is where the known auth-bridge gap lives
 * (`@dbk/auth`'s `getBackendAccessToken` doc comment) — surfaced here as an
 * explicit 501 rather than every route handler independently deciding how
 * to fail.
 */
export async function requireCreatorAccessToken(): Promise<
  { accessToken: string } | { errorResponse: NextResponse }
> {
  const session = await getServerSession();
  if (!session || !session.roles.includes("creator")) {
    return {
      errorResponse: NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to do that.",
            correlationId: crypto.randomUUID(),
          },
        },
        { status: 403 },
      ),
    };
  }

  const accessToken = await getBackendAccessToken();
  if (!accessToken) {
    return {
      errorResponse: NextResponse.json(
        {
          error: {
            code: "AUTH_BRIDGE_NOT_CONFIGURED",
            message:
              "This session isn't bridged to the backend's API yet — see @dbk/auth's getBackendAccessToken for why.",
            correlationId: crypto.randomUUID(),
          },
        },
        { status: 501 },
      ),
    };
  }

  return { accessToken };
}
