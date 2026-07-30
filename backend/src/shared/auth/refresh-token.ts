import { randomBytes, createHash } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { refreshTokens } from '@/shared/db/schema';
import { env } from '@/shared/config/env';
import { AuthenticationError } from '@/shared/errors/base-errors';

/**
 * Refresh-token lifecycle — 08-database-design.md Section 5.5,
 * 09-api-architecture.md Section 3.1, 12-security-architecture.md Section
 * 5.4 (rotation + reuse detection).
 *
 * The raw token is returned to the caller exactly once (to be set as an
 * HttpOnly, Secure, SameSite=Strict cookie by the Route Handler) and never
 * stored — only its SHA-256 hash is persisted, so a database read alone
 * cannot be used to impersonate a session.
 */

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function generateRawToken(): string {
  return randomBytes(48).toString('base64url');
}

export async function issueRefreshToken(params: {
  userId: string;
  sessionId?: string;
  rotatedFromId?: string;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateRawToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

  await db.insert(refreshTokens).values({
    userId: params.userId,
    sessionId: params.sessionId,
    tokenHash: hashToken(rawToken),
    rotatedFromId: params.rotatedFromId,
    expiresAt,
  });

  return { rawToken, expiresAt };
}

/**
 * Validates and rotates a refresh token in one step: the presented token is
 * revoked and a new one is issued in its place, chained via `rotatedFromId`.
 *
 * If the presented token was already revoked, this is treated as a reuse
 * attempt — 12-security-architecture.md Section 5.4's threat model — and
 * every token in the same session is revoked defensively before throwing.
 */
export async function rotateRefreshToken(
  rawToken: string,
): Promise<{ rawToken: string; expiresAt: Date; userId: string; sessionId: string | null }> {
  const tokenHash = hashToken(rawToken);

  const [existing] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!existing) {
    throw new AuthenticationError('Refresh token is invalid.');
  }

  if (existing.revokedAt) {
    if (existing.sessionId) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(eq(refreshTokens.sessionId, existing.sessionId), isNull(refreshTokens.revokedAt)),
        );
    }
    throw new AuthenticationError('Refresh token has already been used. All sessions revoked.');
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw new AuthenticationError('Refresh token has expired.');
  }

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, existing.id));

  const next = await issueRefreshToken({
    userId: existing.userId,
    sessionId: existing.sessionId ?? undefined,
    rotatedFromId: existing.id,
  });

  return { ...next, userId: existing.userId, sessionId: existing.sessionId };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, hashToken(rawToken)));
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}
