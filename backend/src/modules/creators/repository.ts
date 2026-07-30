import { eq } from 'drizzle-orm';
import { db, withTransaction } from '@/shared/db/client';
import { creators, stores } from '@/shared/db/schema';
import { encryptField } from '@/shared/security/field-encryption';
import type { ApplyAsCreatorInput } from './schemas';

/** Creators module Repository Layer — 08-database-design.md Section 7. */

export async function findCreatorByUserId(userId: string) {
  const [row] = await db.select().from(creators).where(eq(creators.userId, userId)).limit(1);
  return row ?? null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Creates the Creator application and its (draft) Store in one transaction
 * — 08-database-design.md Section 7.2's Store always belongs to exactly one
 * Creator, so the two rows come into existence together.
 */
export async function createCreatorApplication(userId: string, input: ApplyAsCreatorInput) {
  return withTransaction(async (tx) => {
    const [creator] = await tx
      .insert(creators)
      .values({
        userId,
        legalName: input.legalName,
        businessName: input.businessName,
        taxIdentifierEncrypted: input.taxIdentifier ? encryptField(input.taxIdentifier) : null,
        category: input.category,
      })
      .returning();

    if (!creator) throw new Error('Failed to create Creator row.');

    const baseSlug = slugify(input.storeName);
    const slug = `${baseSlug}-${creator.id.slice(0, 8)}`;

    const [store] = await tx
      .insert(stores)
      .values({
        creatorId: creator.id,
        name: input.storeName,
        slug,
        status: 'DRAFT',
      })
      .returning();

    if (!store) throw new Error('Failed to create Store row.');

    return { creator, store };
  });
}

export async function approveCreatorApplication(creatorId: string) {
  const [updated] = await db
    .update(creators)
    .set({ onboardingStatus: 'APPROVED', approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(creators.id, creatorId))
    .returning();
  return updated ?? null;
}
