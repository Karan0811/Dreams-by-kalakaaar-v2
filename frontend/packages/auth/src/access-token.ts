import "server-only";
import { cookies } from "next/headers";

/**
 * Backend-session bridge (Sprint 02 fix — see git history for the prior
 * Sprint 01 gap this replaces). This app's Better Auth instance
 * (`better-auth.config.ts`) issues its own httpOnly session cookie; the
 * backend's `authenticate()` middleware only ever accepts a short-lived
 * RS256 JWT it mints itself via `POST /v1/auth/login`
 * (`backend/src/shared/auth/jwt.ts`). Those are two independent systems,
 * so this module is the bridge: `bridgeBackendSession` is called once,
 * right after a successful Better Auth sign-in (see `LoginForm.tsx` /
 * `CreatorLoginForm.tsx` and the signup forms), and stores the backend's
 * own access + refresh tokens in httpOnly cookies scoped to this app's
 * own domain. `getBackendAccessToken` then reads the access-token cookie,
 * transparently refreshing it via the backend's `/v1/auth/refresh`
 * endpoint when it's missing or has expired — so BFF Route Handlers never
 * see a stale token as long as the refresh-token cookie is still valid.
 */
const ACCESS_TOKEN_COOKIE = "dbk_access_token";
const REFRESH_TOKEN_COOKIE = "dbk_refresh_token";
/** Matches the backend's own access-token lifetime (`auth/login/route.ts`'s `accessTokenExpiresIn: 900`), minus a safety margin so a request never races an expiry that's seconds away. */
const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 14;

function backendBaseUrl(): string {
  const baseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error("API_BASE_URL is not configured.");
  return baseUrl;
}

/**
 * Call this right after a successful Better Auth `signIn`/`signUp` — it
 * authenticates against the backend's own REST auth endpoint with the same
 * credentials and stores the resulting tokens. Returns `false` (never
 * throws) on failure so a caller can fall back to a generic error message
 * without leaking backend-specific details.
 *
 * The backend returns its access token in the JSON body but its refresh
 * token only as a `Set-Cookie` header scoped to the backend's own domain
 * (`shared/http/cookies.ts`'s `buildRefreshTokenCookie`, `Path=/v1/auth`).
 * Since this call is server-to-server (this app's Node runtime calling the
 * backend directly, not a browser request), that header is readable here
 * via `response.headers.getSetCookie()` even though a browser could never
 * read it cross-origin — so it's extracted and re-issued as this app's own
 * same-origin cookie for `refreshBackendSession` below to use.
 */
export async function bridgeBackendSession(email: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${backendBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return false;

    const body = (await response.json()) as { accessToken: string; accessTokenExpiresIn: number };
    const refreshToken = extractRefreshTokenCookie(response);

    const store = await cookies();
    store.set(ACCESS_TOKEN_COOKIE, body.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: body.accessTokenExpiresIn ?? ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
    if (refreshToken) {
      store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sign-up variant of `bridgeBackendSession` — calls the backend's own
 * `POST /v1/auth/register` instead of `/v1/auth/login`, since at sign-up
 * time no backend account exists yet to log into. This app's Better Auth
 * `signUp.email` call creates a row in Better Auth's own `user` table
 * (`packages/auth/migrations/0001_better_auth_schema.sql`) — a completely
 * separate table from the backend's own `users`
 * (`shared/db/schema/identity.ts`) — so a fresh sign-up genuinely has no
 * matching backend account until this registers one with the same
 * credentials.
 */
export async function bridgeBackendRegistration(
  email: string,
  password: string,
  displayName: string,
): Promise<boolean> {
  try {
    const response = await fetch(`${backendBaseUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });
    if (!response.ok) return false;

    const body = (await response.json()) as { accessToken: string; accessTokenExpiresIn: number };
    const refreshToken = extractRefreshTokenCookie(response);

    const store = await cookies();
    store.set(ACCESS_TOKEN_COOKIE, body.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: body.accessTokenExpiresIn ?? ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
    if (refreshToken) {
      store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return true;
  } catch {
    return false;
  }
}

/** Backend's `BACKEND_REFRESH_TOKEN_COOKIE` name (`shared/http/cookies.ts`'s `REFRESH_TOKEN_COOKIE`) — duplicated as a literal here since this package can't import backend source across the repo boundary. */
const BACKEND_REFRESH_TOKEN_COOKIE = "dbk_refresh_token";

function extractRefreshTokenCookie(response: Response): string | null {
  const rawCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie") ?? ""].filter(Boolean);

  for (const raw of rawCookies) {
    const pair = raw.split(";")[0] ?? "";
    const [name, ...rest] = pair.split("=");
    if (name?.trim() === BACKEND_REFRESH_TOKEN_COOKIE) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}

async function refreshBackendSession(): Promise<string | null> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${backendBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `${BACKEND_REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}` },
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { accessToken: string; accessTokenExpiresIn?: number };
    const rotatedRefreshToken = extractRefreshTokenCookie(response);

    store.set(ACCESS_TOKEN_COOKIE, body.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: body.accessTokenExpiresIn ?? ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
    if (rotatedRefreshToken) {
      store.set(REFRESH_TOKEN_COOKIE, rotatedRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return body.accessToken;
  } catch {
    return null;
  }
}

/** Clears both bridge cookies — called from each app's logout flow alongside Better Auth's own `signOut`. */
export async function clearBackendSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export async function getBackendAccessToken(): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (existing) return existing;

  // No access token (expired past its maxAge, or never set this session) —
  // try the refresh token before giving up, so a long-lived Better Auth
  // session doesn't get logged out of the backend every 14 minutes.
  return refreshBackendSession();
}
