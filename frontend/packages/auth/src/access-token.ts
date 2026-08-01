import "server-only";
import { cookies } from "next/headers";

/**
 * KNOWN GAP (Sprint 01 — see docs/testing/sprint-01-products.md and
 * DEVELOPMENT_STATUS.md): this app's Better Auth instance
 * (`better-auth.config.ts`) and the backend's own `authenticate()`
 * middleware (`backend/src/shared/middleware/authenticate.ts`) are two
 * independent systems. Better Auth issues an httpOnly session cookie this
 * app validates via `getServerSession()`; the backend only ever accepts a
 * short-lived RS256 JWT it mints itself
 * (`backend/src/shared/auth/jwt.ts`'s `issueAccessToken`), returned from
 * `POST /v1/auth/login` — a REST endpoint no frontend login form in this
 * app currently calls.
 *
 * There is no cookie or token today that legitimately bridges the two. This
 * function does not fabricate one: it looks for a `dbk_access_token` cookie
 * (the name a real bridge would plausibly use — a BFF login route that
 * calls the backend's `/v1/auth/login` and stores the returned
 * `accessToken` here) and returns `null` if absent, which is always, right
 * now, since nothing sets it yet. Every caller must treat `null` as "the
 * auth bridge isn't wired up" and fail loudly (see the Products BFF routes
 * in apps/creator/app/api/products/**), not silently proceed.
 *
 * Fixing this for real means either (a) replacing this app's local Better
 * Auth session with one obtained by calling the backend's REST auth
 * endpoints directly, or (b) adding a JWKS-based bridge so the backend can
 * also verify this app's Better Auth session tokens. Both are legitimate,
 * cross-cutting Authentication-sprint work — out of scope for the Products
 * module to redesign unilaterally.
 */
const ACCESS_TOKEN_COOKIE = "dbk_access_token";

export async function getBackendAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}
