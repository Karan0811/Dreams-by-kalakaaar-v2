import { verifyAccessToken, type AccessTokenClaims } from '@/shared/auth/jwt';
import { AuthenticationError } from '@/shared/errors/base-errors';

/**
 * Authentication middleware step — 10-backend-architecture.md Section 6.1.
 *
 * Extracts and verifies the bearer access token, per
 * 09-api-architecture.md Section 3.2 (`Authorization: Bearer <token>`).
 * Route Handlers that permit anonymous access simply don't call this;
 * everything else calls it first and gets typed, verified claims back.
 */
export interface AuthenticatedContext {
  userId: string;
  email: string;
  roles: string[];
  sessionId: string;
}

export async function authenticate(request: Request): Promise<AuthenticatedContext> {
  const header = request.headers.get('authorization');

  if (!header?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed Authorization header.');
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    throw new AuthenticationError('Missing bearer token.');
  }

  let claims: AccessTokenClaims;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    throw new AuthenticationError('Access token is invalid or expired.');
  }

  return {
    userId: claims.sub,
    email: claims.email,
    roles: claims.roles,
    sessionId: claims.sessionId,
  };
}

/** Best-effort variant for endpoints that behave differently for logged-in vs anonymous callers, but never require auth. */
export async function authenticateOptional(request: Request): Promise<AuthenticatedContext | null> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  try {
    return await authenticate(request);
  } catch {
    return null;
  }
}
