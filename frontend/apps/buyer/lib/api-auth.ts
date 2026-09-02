import { NextResponse } from "next/server";
import { getBackendAccessToken } from "@dbk/auth/server";

/**
 * The backend access token is the authoritative session for BFF requests:
 * the upstream backend verifies its signature and claims on every request.
 * Do not call `getServerSession()` here. That function intentionally calls
 * the backend's `/auth/me` endpoint to build a display profile, but doing so
 * before every BFF request adds a redundant rate-limit request, user query,
 * and RBAC query to every cart/wishlist/order operation.
 */
export async function requireAccessToken(): Promise<
  { accessToken: string } | { errorResponse: NextResponse }
> {
  const accessToken = await getBackendAccessToken();
  if (!accessToken) {
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

  return { accessToken };
}
