import { NextResponse } from "next/server";
import { getServerSession, getBackendAccessToken } from "@dbk/auth/server";

/**
 * Every buyer-account BFF route (Cart, Wishlist, Addresses, Orders,
 * Reviews, Notifications) needs the same two checks: a valid session and a
 * backend-bridged access token. Mirrors `apps/creator/lib/api-auth.ts`'s
 * `requireCreatorAccessToken` — same shape, minus the `creator` role
 * check, since any authenticated user is a buyer by default (no separate
 * buyer role exists in RBAC).
 */
export async function requireAccessToken(): Promise<
  { accessToken: string } | { errorResponse: NextResponse }
> {
  const session = await getServerSession();
  if (!session) {
    return {
      errorResponse: NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Please sign in to continue.",
            correlationId: crypto.randomUUID(),
          },
        },
        { status: 401 },
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
            message: "This session isn't bridged to the backend's API yet.",
            correlationId: crypto.randomUUID(),
          },
        },
        { status: 501 },
      ),
    };
  }

  return { accessToken };
}
