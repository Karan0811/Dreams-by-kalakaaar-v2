import { env } from '@/shared/config/env';

export const REFRESH_TOKEN_COOKIE = 'dbk_refresh_token';

/**
 * Refresh-token cookie attributes — 09-api-architecture.md Section 3.1:
 * `HttpOnly`, `Secure`, `SameSite=Strict`, never exposed to client-side JS.
 */
export function buildRefreshTokenCookie(rawToken: string, expiresAt: Date): string {
  const attributes = [
    `${REFRESH_TOKEN_COOKIE}=${rawToken}`,
    `Expires=${expiresAt.toUTCString()}`,
    'Path=/api/v1/auth',
    'HttpOnly',
    'SameSite=Strict',
  ];

  if (env.NODE_ENV === 'production') {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export function buildClearedRefreshTokenCookie(): string {
  const attributes = [
    `${REFRESH_TOKEN_COOKIE}=`,
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Path=/api/v1/auth',
    'HttpOnly',
    'SameSite=Strict',
  ];

  if (env.NODE_ENV === 'production') {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export function readRefreshTokenCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${REFRESH_TOKEN_COOKIE}=`));

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}
