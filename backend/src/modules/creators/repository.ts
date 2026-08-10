import { and, eq } from 'drizzle-orm';
import { db, withTransaction } from '@/shared/db/client';
import {
  creators,
  stores,
  creatorAddresses,
  creatorBankDetails,
  creatorSocialLinks,
  creatorDocuments,
} from '@/shared/db/schema';
import { encryptField } from '@/shared/security/field-encryption';
import type {
  ApplyAsCreatorInput,
  UpdateCreatorProfileInput,
  CreateCreatorAddressInput,
  UpdateCreatorAddressInput,
  CreateCreatorBankDetailsInput,
  UpdateCreatorBankDetailsInput,
  CreateCreatorSocialLinkInput,
  UpdateCreatorSocialLinkInput,
  CreateCreatorDocumentInput,
  ReviewCreatorDocumentInput,
} from './schemas';

/** Creators module Repository Layer — 08-database-design.md Section 7. */

export async function findCreatorByUserId(userId: string) {
  const [row] = await db.select().from(creators).where(eq(creators.userId, userId)).limit(1);
  return row ?? null;
}

/**
 * Sprint 01 addition: every creator-scoped Products route
 * (`/v1/stores/{storeId}/products/...`) needs the caller's `storeId`, but
 * nothing previously exposed the Creator→Store relationship on a read path
 * — `createCreatorApplication` below creates both rows together, but
 * `GET /v1/creator/application` only ever returned the Creator row. This
 * is additive: the Store row already existed the whole time.
 */
export async function findStoreByCreatorId(creatorId: string) {
  const [row] = await db.select().from(stores).where(eq(stores.creatorId, creatorId)).limit(1);
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

/** Sprint 02 additions below — Creator module full CRUD. */

export async function findCreatorById(creatorId: string) {
  const [row] = await db.select().from(creators).where(eq(creators.id, creatorId)).limit(1);
  return row ?? null;
}

export async function updateCreatorProfile(creatorId: string, input: UpdateCreatorProfileInput) {
  const [updated] = await db
    .update(creators)
    .set({
      ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
      ...(input.businessName !== undefined ? { businessName: input.businessName } : {}),
      ...(input.taxIdentifier !== undefined
        ? { taxIdentifierEncrypted: encryptField(input.taxIdentifier) }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      updatedAt: new Date(),
    })
    .where(eq(creators.id, creatorId))
    .returning();
  return updated ?? null;
}

export async function setCreatorOnboardingStatus(
  creatorId: string,
  status: 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED',
) {
  const [updated] = await db
    .update(creators)
    .set({
      onboardingStatus: status,
      ...(status === 'APPROVED' ? { approvedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(creators.id, creatorId))
    .returning();
  return updated ?? null;
}

// --- Addresses ---------------------------------------------------------

export async function listCreatorAddresses(creatorId: string) {
  return db.select().from(creatorAddresses).where(eq(creatorAddresses.creatorId, creatorId));
}

export async function findCreatorAddressById(creatorId: string, addressId: string) {
  const [row] = await db
    .select()
    .from(creatorAddresses)
    .where(and(eq(creatorAddresses.id, addressId), eq(creatorAddresses.creatorId, creatorId)))
    .limit(1);
  return row ?? null;
}

export async function createCreatorAddress(creatorId: string, input: CreateCreatorAddressInput) {
  return withTransaction(async (tx) => {
    if (input.isDefault) {
      await tx
        .update(creatorAddresses)
        .set({ isDefault: false })
        .where(eq(creatorAddresses.creatorId, creatorId));
    }
    const [row] = await tx
      .insert(creatorAddresses)
      .values({ creatorId, ...input })
      .returning();
    return row;
  });
}

export async function updateCreatorAddress(
  creatorId: string,
  addressId: string,
  input: UpdateCreatorAddressInput,
) {
  return withTransaction(async (tx) => {
    if (input.isDefault) {
      await tx
        .update(creatorAddresses)
        .set({ isDefault: false })
        .where(eq(creatorAddresses.creatorId, creatorId));
    }
    const [row] = await tx
      .update(creatorAddresses)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(creatorAddresses.id, addressId), eq(creatorAddresses.creatorId, creatorId)))
      .returning();
    return row ?? null;
  });
}

export async function deleteCreatorAddress(creatorId: string, addressId: string) {
  const [row] = await db
    .delete(creatorAddresses)
    .where(and(eq(creatorAddresses.id, addressId), eq(creatorAddresses.creatorId, creatorId)))
    .returning();
  return row ?? null;
}

// --- Bank details --------------------------------------------------------

export async function listCreatorBankDetails(creatorId: string) {
  return db.select().from(creatorBankDetails).where(eq(creatorBankDetails.creatorId, creatorId));
}

export async function findCreatorBankDetailById(creatorId: string, bankDetailId: string) {
  const [row] = await db
    .select()
    .from(creatorBankDetails)
    .where(and(eq(creatorBankDetails.id, bankDetailId), eq(creatorBankDetails.creatorId, creatorId)))
    .limit(1);
  return row ?? null;
}

export async function createCreatorBankDetail(creatorId: string, input: CreateCreatorBankDetailsInput) {
  return withTransaction(async (tx) => {
    if (input.isPrimary) {
      await tx
        .update(creatorBankDetails)
        .set({ isPrimary: false })
        .where(eq(creatorBankDetails.creatorId, creatorId));
    }
    const [row] = await tx
      .insert(creatorBankDetails)
      .values({
        creatorId,
        accountHolderName: input.accountHolderName,
        accountNumberEncrypted: encryptField(input.accountNumber),
        accountNumberLast4: input.accountNumber.slice(-4),
        ifscCodeEncrypted: encryptField(input.ifscCode),
        bankName: input.bankName,
        branchName: input.branchName,
        isPrimary: input.isPrimary,
      })
      .returning();
    if (!row) throw new Error('Failed to create Creator bank detail row.');
    return row;
  });
}

export async function updateCreatorBankDetail(
  creatorId: string,
  bankDetailId: string,
  input: UpdateCreatorBankDetailsInput,
) {
  return withTransaction(async (tx) => {
    if (input.isPrimary) {
      await tx
        .update(creatorBankDetails)
        .set({ isPrimary: false })
        .where(eq(creatorBankDetails.creatorId, creatorId));
    }
    const [row] = await tx
      .update(creatorBankDetails)
      .set({
        ...(input.accountHolderName !== undefined
          ? { accountHolderName: input.accountHolderName }
          : {}),
        ...(input.accountNumber !== undefined
          ? {
              accountNumberEncrypted: encryptField(input.accountNumber),
              accountNumberLast4: input.accountNumber.slice(-4),
              isVerified: false,
            }
          : {}),
        ...(input.ifscCode !== undefined
          ? { ifscCodeEncrypted: encryptField(input.ifscCode), isVerified: false }
          : {}),
        ...(input.bankName !== undefined ? { bankName: input.bankName } : {}),
        ...(input.branchName !== undefined ? { branchName: input.branchName } : {}),
        ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(creatorBankDetails.id, bankDetailId), eq(creatorBankDetails.creatorId, creatorId)))
      .returning();
    return row ?? null;
  });
}

export async function deleteCreatorBankDetail(creatorId: string, bankDetailId: string) {
  const [row] = await db
    .delete(creatorBankDetails)
    .where(and(eq(creatorBankDetails.id, bankDetailId), eq(creatorBankDetails.creatorId, creatorId)))
    .returning();
  return row ?? null;
}

// --- Social links --------------------------------------------------------

export async function listCreatorSocialLinks(creatorId: string) {
  return db
    .select()
    .from(creatorSocialLinks)
    .where(eq(creatorSocialLinks.creatorId, creatorId))
    .orderBy(creatorSocialLinks.displayOrder);
}

export async function findCreatorSocialLinkById(creatorId: string, socialLinkId: string) {
  const [row] = await db
    .select()
    .from(creatorSocialLinks)
    .where(and(eq(creatorSocialLinks.id, socialLinkId), eq(creatorSocialLinks.creatorId, creatorId)))
    .limit(1);
  return row ?? null;
}

export async function findCreatorSocialLinkByPlatform(creatorId: string, platform: string) {
  const [row] = await db
    .select()
    .from(creatorSocialLinks)
    .where(
      and(
        eq(creatorSocialLinks.creatorId, creatorId),
        eq(creatorSocialLinks.platform, platform as (typeof creatorSocialLinks.platform.enumValues)[number]),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createCreatorSocialLink(creatorId: string, input: CreateCreatorSocialLinkInput) {
  const [row] = await db
    .insert(creatorSocialLinks)
    .values({ creatorId, ...input })
    .returning();
  return row;
}

export async function updateCreatorSocialLink(
  creatorId: string,
  socialLinkId: string,
  input: UpdateCreatorSocialLinkInput,
) {
  const [row] = await db
    .update(creatorSocialLinks)
    .set(input)
    .where(and(eq(creatorSocialLinks.id, socialLinkId), eq(creatorSocialLinks.creatorId, creatorId)))
    .returning();
  return row ?? null;
}

export async function deleteCreatorSocialLink(creatorId: string, socialLinkId: string) {
  const [row] = await db
    .delete(creatorSocialLinks)
    .where(and(eq(creatorSocialLinks.id, socialLinkId), eq(creatorSocialLinks.creatorId, creatorId)))
    .returning();
  return row ?? null;
}

// --- Documents -------------------------------------------------------------

export async function listCreatorDocuments(creatorId: string) {
  return db.select().from(creatorDocuments).where(eq(creatorDocuments.creatorId, creatorId));
}

export async function findCreatorDocumentById(creatorId: string, documentId: string) {
  const [row] = await db
    .select()
    .from(creatorDocuments)
    .where(and(eq(creatorDocuments.id, documentId), eq(creatorDocuments.creatorId, creatorId)))
    .limit(1);
  return row ?? null;
}

/** Admin lookup (not scoped to a specific caller's creatorId — used by the review flow). */
export async function findCreatorDocumentByIdAnyCreator(documentId: string) {
  const [row] = await db.select().from(creatorDocuments).where(eq(creatorDocuments.id, documentId)).limit(1);
  return row ?? null;
}

export async function createCreatorDocument(creatorId: string, input: CreateCreatorDocumentInput) {
  const [row] = await db
    .insert(creatorDocuments)
    .values({ creatorId, mediaId: input.mediaId, type: input.type })
    .returning();
  return row;
}

export async function deleteCreatorDocument(creatorId: string, documentId: string) {
  const [row] = await db
    .delete(creatorDocuments)
    .where(and(eq(creatorDocuments.id, documentId), eq(creatorDocuments.creatorId, creatorId)))
    .returning();
  return row ?? null;
}

export async function reviewCreatorDocument(
  documentId: string,
  reviewerId: string,
  input: ReviewCreatorDocumentInput,
) {
  const [row] = await db
    .update(creatorDocuments)
    .set({
      status: input.status,
      reviewerId,
      reviewNotes: input.reviewNotes,
      reviewedAt: new Date(),
    })
    .where(eq(creatorDocuments.id, documentId))
    .returning();
  return row ?? null;
}
