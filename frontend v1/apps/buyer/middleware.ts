import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Cookie-presence check only — fast, edge-safe, and intentionally *not*
 * authoritative (11-frontend-architecture.md §12.2). The `(account)` route
 * group's layout re-validates the actual session server-side on every
 * request regardless of what happens here; this middleware exists purely to
 * bounce obviously-signed-out visitors before a page even renders.
 *
 * FIX (production audit): previously did a hand-rolled lookup of two
 * hardcoded cookie names. Better Auth ships `getSessionCookie()` specifically
 * for this — Edge-safe (no database round-trip, unlike `auth.api.getSession`,
 * which needs the `pg` pool from `@dbk/auth/server` and has no business
 * running on the Edge runtime), and it correctly accounts for the
 * `__Secure-` prefix and any cookie-name/prefix customization made in
 * `better-auth.config.ts`, rather than us keeping that logic in sync by hand
 * in two places.
 */
const PROTECTED_PREFIXES = ["/account"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
