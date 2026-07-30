import { randomBytes, createHash } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import {
  authenticationAccounts,
  emailVerifications,
  passwordResets,
  sessions,
  users,
} from '@/shared/db/schema';

/** Auth module Repository Layer — 08-database-design.md Section 5. */

function hashOpaqueToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function findUserByEmail(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

export async function findUserById(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return row ?? null;
}

export async function findCredentialAccount(userId: string) {
  const [row] = await db
    .select()
    .from(authenticationAccounts)
    .where(
      and(eq(authenticationAccounts.userId, userId), eq(authenticationAccounts.provider, 'credential')),
    )
    .limit(1);
  return row ?? null;
}

export async function updateCredentialPasswordHash(userId: string, passwordHash: string) {
  await db
    .update(authenticationAccounts)
    .set({ passwordHash, updatedAt: new Date() })
    .where(
      and(eq(authenticationAccounts.userId, userId), eq(authenticationAccounts.provider, 'credential')),
    );
}

export async function findSessionById(sessionId: string) {
  const [row] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  return row ?? null;
}

export async function revokeSession(sessionId: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
}

export async function revokeAllSessionsForUser(userId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/** Creates a time-boxed email-verification row and returns the raw token to email to the user. */
export async function createEmailVerification(params: {
  userId: string;
  targetEmail: string;
  ttlMinutes: number;
}): Promise<string> {
  const rawToken = generateOpaqueToken();
  await db.insert(emailVerifications).values({
    userId: params.userId,
    targetEmail: params.targetEmail,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt: new Date(Date.now() + params.ttlMinutes * 60_000),
  });
  return rawToken;
}

export async function consumeEmailVerification(rawToken: string) {
  const tokenHash = hashOpaqueToken(rawToken);
  const [row] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.consumedAt || row.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await db
    .update(emailVerifications)
    .set({ consumedAt: new Date() })
    .where(eq(emailVerifications.id, row.id));

  return row;
}

export async function markUserEmailVerified(userId: string) {
  await db
    .update(users)
    .set({ emailVerified: true, status: 'ACTIVE', updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/** Creates a time-boxed password-reset row and returns the raw token to email to the user. */
export async function createPasswordReset(params: {
  userId: string;
  requestingIp?: string;
  ttlMinutes: number;
}): Promise<string> {
  const rawToken = generateOpaqueToken();
  await db.insert(passwordResets).values({
    userId: params.userId,
    tokenHash: hashOpaqueToken(rawToken),
    requestingIp: params.requestingIp,
    expiresAt: new Date(Date.now() + params.ttlMinutes * 60_000),
  });
  return rawToken;
}

export async function consumePasswordReset(rawToken: string) {
  const tokenHash = hashOpaqueToken(rawToken);
  const [row] = await db
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.consumedAt || row.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await db
    .update(passwordResets)
    .set({ consumedAt: new Date() })
    .where(eq(passwordResets.id, row.id));

  return row;
}

export async function findSessionByToken(token: string) {
  const [row] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  return row ?? null;
}
