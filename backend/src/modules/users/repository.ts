import { eq } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { userProfiles, users } from '@/shared/db/schema';
import type { UpdateProfileInput } from './schemas';

/**
 * Users module Repository Layer — 10-backend-architecture.md Section 10.
 *
 * The Repository Layer's job is exactly the SQL — no business rules, no
 * validation, no authorization decisions (those belong to `service.ts`).
 */

export async function findUserWithProfile(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerified: users.emailVerified,
      status: users.status,
      locale: users.locale,
      timezone: users.timezone,
      createdAt: users.createdAt,
      displayName: userProfiles.displayName,
      avatarMediaId: userProfiles.avatarMediaId,
      bio: userProfiles.bio,
      pronouns: userProfiles.pronouns,
      isPublicProfile: userProfiles.isPublicProfile,
    })
    .from(users)
    .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const [updated] = await db
    .update(userProfiles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId))
    .returning();

  return updated ?? null;
}

export async function createUserProfile(params: { userId: string; displayName: string }) {
  await db.insert(userProfiles).values({
    userId: params.userId,
    displayName: params.displayName,
  });
}
