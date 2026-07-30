import { SignJWT, jwtVerify, importPKCS8, importSPKI, type JWTPayload, type KeyLike } from 'jose';
import { env } from '@/shared/config/env';

/**
 * Access-token issuance and verification — 09-api-architecture.md Section
 * 3.1, 12-security-architecture.md Section 5.3.
 *
 * Short-lived (15 min default), RS256-signed, stateless-verifiable JWTs
 * carrying the caller's identity and a snapshot of their RBAC roles at
 * issuance time. This is deliberately layered on top of — not a
 * replacement for — the Better Auth session created in
 * `shared/auth/better-auth.config.ts`: the Better Auth session is what
 * `modules/auth/service.ts` re-validates on refresh/logout, while this
 * access token is what every other Route Handler verifies on each request
 * without a database round trip (Section 3.1's stated rationale).
 */

const ALG = 'RS256';
const ISSUER = 'dreams-by-kalakaaar-backend';
const AUDIENCE = 'dreams-by-kalakaaar-api';

export interface AccessTokenClaims extends JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  sessionId: string;
}

let cachedPrivateKey: KeyLike | undefined;
let cachedPublicKey: KeyLike | undefined;

async function getPrivateKey(): Promise<KeyLike> {
  if (!cachedPrivateKey) {
    cachedPrivateKey = await importPKCS8(normalizePem(env.JWT_PRIVATE_KEY), ALG);
  }
  return cachedPrivateKey;
}

async function getPublicKey(): Promise<KeyLike> {
  if (!cachedPublicKey) {
    cachedPublicKey = await importSPKI(normalizePem(env.JWT_PUBLIC_KEY), ALG);
  }
  return cachedPublicKey;
}

/** Env files store PEM keys with literal `\n` escapes; restore real newlines. */
function normalizePem(pem: string): string {
  return pem.includes('\\n') ? pem.replace(/\\n/g, '\n') : pem;
}

export async function issueAccessToken(params: {
  userId: string;
  email: string;
  roles: string[];
  sessionId: string;
}): Promise<string> {
  const privateKey = await getPrivateKey();

  return new SignJWT({ email: params.email, roles: params.roles, sessionId: params.sessionId })
    .setProtectedHeader({ alg: ALG })
    .setSubject(params.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(privateKey);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const publicKey = await getPublicKey();
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return payload as AccessTokenClaims;
}
