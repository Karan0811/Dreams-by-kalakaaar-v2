import { SignJWT, jwtVerify, importPKCS8, importSPKI, generateKeyPair, type JWTPayload, type KeyLike } from 'jose';
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
let developmentKeyPair: { privateKey: KeyLike; publicKey: KeyLike } | undefined;

async function getPrivateKey(): Promise<KeyLike> {
  if (!cachedPrivateKey) {
    // In development with placeholder keys, generate a temporary key pair
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isPlaceholder = env.JWT_PRIVATE_KEY.includes('replace-with') || 
                         env.JWT_PRIVATE_KEY.length < 100;
    
    if (isDevelopment && isPlaceholder) {
      if (!developmentKeyPair) {
        developmentKeyPair = await generateKeyPair(ALG);
      }
      cachedPrivateKey = developmentKeyPair.privateKey;
    } else {
      cachedPrivateKey = await importPKCS8(normalizePem(env.JWT_PRIVATE_KEY), ALG);
    }
  }
  return cachedPrivateKey;
}

async function getPublicKey(): Promise<KeyLike> {
  if (!cachedPublicKey) {
    // In development with placeholder keys, use the generated key pair
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isPlaceholder = env.JWT_PUBLIC_KEY.includes('replace-with') || 
                         env.JWT_PUBLIC_KEY.length < 100;
    
    if (isDevelopment && isPlaceholder) {
      if (!developmentKeyPair) {
        developmentKeyPair = await generateKeyPair(ALG);
      }
      cachedPublicKey = developmentKeyPair.publicKey;
    } else {
      cachedPublicKey = await importSPKI(normalizePem(env.JWT_PUBLIC_KEY), ALG);
    }
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
