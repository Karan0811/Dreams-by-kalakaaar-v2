import { randomUUID } from 'node:crypto';
import { assignRole } from '@/shared/authz/repository';
import { createPresignedUploadUrl, publicUrlForKey } from '@/shared/storage/r2-client';
import * as sharedMediaRepository from '@/shared/storage/media-repository';
import * as notificationsService from '@/modules/notifications/service';
import * as creatorsRepository from './repository';
import {
  CreatorApplicationAlreadyExistsError,
  CreatorApplicationNotFoundError,
  CreatorNotFoundError,
  CreatorAddressNotFoundError,
  CreatorBankDetailsNotFoundError,
  CreatorSocialLinkNotFoundError,
  CreatorDocumentNotFoundError,
  CreatorDocumentAlreadyReviewedError,
  InvalidCreatorStatusTransitionError,
} from './errors';
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
  RequestCreatorDocumentUploadInput,
  ReviewCreatorDocumentInput,
} from './schemas';

/** Creators module Service Layer. */

export async function applyAsCreator(userId: string, input: ApplyAsCreatorInput) {
  const existing = await creatorsRepository.findCreatorByUserId(userId);
  if (existing) throw new CreatorApplicationAlreadyExistsError();

  const { creator, store } = await creatorsRepository.createCreatorApplication(userId, input);

  // 08-database-design.md Section 6.4: the Creator Team Owner role is
  // store-scoped, granted the moment the Store row exists — approval only
  // gates whether the Store can go ACTIVE and start selling, not whether
  // its owner can manage it in draft.
  await assignRole({ userId, roleName: 'Creator Team Owner', storeId: store.id });

  return { creator, store };
}

export async function getMyApplication(userId: string) {
  const creator = await creatorsRepository.findCreatorByUserId(userId);
  if (!creator) throw new CreatorApplicationNotFoundError();

  // Sprint 01: the Store row is created in the same transaction as the
  // Creator row (see createCreatorApplication above), so this should never
  // be null for an existing creator — but a caller (the Products module's
  // ownership check) still handles a null store defensively rather than
  // assuming this invariant holds forever.
  const store = await creatorsRepository.findStoreByCreatorId(creator.id);

  return { creator, store };
}

/** Sprint 02 additions below. */

/** Resolves the userId that owns a given creatorId — the authorization primitive every Creator sub-resource route needs. */
export async function getCreatorOwnerUserId(creatorId: string): Promise<string | null> {
  const creator = await creatorsRepository.findCreatorById(creatorId);
  return creator?.userId ?? null;
}

async function requireOwnCreator(userId: string) {
  const creator = await creatorsRepository.findCreatorByUserId(userId);
  if (!creator) throw new CreatorApplicationNotFoundError();
  return creator;
}

export async function updateMyProfile(userId: string, input: UpdateCreatorProfileInput) {
  const creator = await requireOwnCreator(userId);
  const updated = await creatorsRepository.updateCreatorProfile(creator.id, input);
  if (!updated) throw new CreatorNotFoundError();
  return updated;
}

// --- Addresses -------------------------------------------------------------

export async function listMyAddresses(userId: string) {
  const creator = await requireOwnCreator(userId);
  return creatorsRepository.listCreatorAddresses(creator.id);
}

export async function createMyAddress(userId: string, input: CreateCreatorAddressInput) {
  const creator = await requireOwnCreator(userId);
  return creatorsRepository.createCreatorAddress(creator.id, input);
}

export async function updateMyAddress(userId: string, addressId: string, input: UpdateCreatorAddressInput) {
  const creator = await requireOwnCreator(userId);
  const updated = await creatorsRepository.updateCreatorAddress(creator.id, addressId, input);
  if (!updated) throw new CreatorAddressNotFoundError();
  return updated;
}

export async function deleteMyAddress(userId: string, addressId: string) {
  const creator = await requireOwnCreator(userId);
  const deleted = await creatorsRepository.deleteCreatorAddress(creator.id, addressId);
  if (!deleted) throw new CreatorAddressNotFoundError();
  return deleted;
}

// --- Bank details ------------------------------------------------------------

/** Never returns the decrypted account number/IFSC — only the last-4 display value, matching this field's "encrypted at rest, never re-exposed" design intent. */
function toPublicBankDetail(row: Awaited<ReturnType<typeof creatorsRepository.listCreatorBankDetails>>[number]) {
  return {
    id: row.id,
    accountHolderName: row.accountHolderName,
    accountNumberLast4: row.accountNumberLast4,
    bankName: row.bankName,
    branchName: row.branchName,
    isVerified: row.isVerified,
    isPrimary: row.isPrimary,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listMyBankDetails(userId: string) {
  const creator = await requireOwnCreator(userId);
  const rows = await creatorsRepository.listCreatorBankDetails(creator.id);
  return rows.map(toPublicBankDetail);
}

export async function createMyBankDetail(userId: string, input: CreateCreatorBankDetailsInput) {
  const creator = await requireOwnCreator(userId);
  const row = await creatorsRepository.createCreatorBankDetail(creator.id, input);
  return toPublicBankDetail(row);
}

export async function updateMyBankDetail(
  userId: string,
  bankDetailId: string,
  input: UpdateCreatorBankDetailsInput,
) {
  const creator = await requireOwnCreator(userId);
  const updated = await creatorsRepository.updateCreatorBankDetail(creator.id, bankDetailId, input);
  if (!updated) throw new CreatorBankDetailsNotFoundError();
  return toPublicBankDetail(updated);
}

export async function deleteMyBankDetail(userId: string, bankDetailId: string) {
  const creator = await requireOwnCreator(userId);
  const deleted = await creatorsRepository.deleteCreatorBankDetail(creator.id, bankDetailId);
  if (!deleted) throw new CreatorBankDetailsNotFoundError();
  return deleted;
}

// --- Social links --------------------------------------------------------

export async function listMySocialLinks(userId: string) {
  const creator = await requireOwnCreator(userId);
  return creatorsRepository.listCreatorSocialLinks(creator.id);
}

export async function createMySocialLink(userId: string, input: CreateCreatorSocialLinkInput) {
  const creator = await requireOwnCreator(userId);
  const existing = await creatorsRepository.findCreatorSocialLinkByPlatform(creator.id, input.platform);
  if (existing) {
    return creatorsRepository.updateCreatorSocialLink(creator.id, existing.id, {
      url: input.url,
      displayOrder: input.displayOrder,
    });
  }
  return creatorsRepository.createCreatorSocialLink(creator.id, input);
}

export async function updateMySocialLink(
  userId: string,
  socialLinkId: string,
  input: UpdateCreatorSocialLinkInput,
) {
  const creator = await requireOwnCreator(userId);
  const updated = await creatorsRepository.updateCreatorSocialLink(creator.id, socialLinkId, input);
  if (!updated) throw new CreatorSocialLinkNotFoundError();
  return updated;
}

export async function deleteMySocialLink(userId: string, socialLinkId: string) {
  const creator = await requireOwnCreator(userId);
  const deleted = await creatorsRepository.deleteCreatorSocialLink(creator.id, socialLinkId);
  if (!deleted) throw new CreatorSocialLinkNotFoundError();
  return deleted;
}

// --- Documents -------------------------------------------------------------

export async function listMyDocuments(userId: string) {
  const creator = await requireOwnCreator(userId);
  return creatorsRepository.listCreatorDocuments(creator.id);
}

/** Step 1 of the document upload flow — same presigned-URL pattern as `modules/products/service.ts`'s `requestProductMediaUpload`. */
export async function requestMyDocumentUpload(userId: string, input: RequestCreatorDocumentUploadInput) {
  const creator = await requireOwnCreator(userId);

  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const storageKey = `creator-documents/${creator.id}/${randomUUID()}-${safeFileName}`;

  const uploadUrl = await createPresignedUploadUrl({ key: storageKey, contentType: input.contentType });

  const mediaRow = await sharedMediaRepository.createPendingMediaRow({
    uploadedById: userId,
    type: input.contentType === 'application/pdf' ? 'DOCUMENT' : 'IMAGE',
    storageKey,
    publicUrl: publicUrlForKey(storageKey),
    mimeType: input.contentType,
    sizeBytes: input.sizeBytes,
  });

  return { uploadUrl, mediaId: mediaRow.id };
}

/** Step 2: confirm the upload succeeded and record the document for platform review. */
export async function createMyDocument(userId: string, input: CreateCreatorDocumentInput) {
  const creator = await requireOwnCreator(userId);

  const mediaRow = await sharedMediaRepository.findMediaById(input.mediaId);
  if (!mediaRow) throw new CreatorDocumentNotFoundError();

  await sharedMediaRepository.markMediaReady(input.mediaId);
  return creatorsRepository.createCreatorDocument(creator.id, input);
}

export async function deleteMyDocument(userId: string, documentId: string) {
  const creator = await requireOwnCreator(userId);
  const deleted = await creatorsRepository.deleteCreatorDocument(creator.id, documentId);
  if (!deleted) throw new CreatorDocumentNotFoundError();
  return deleted;
}

/** Admin — reviews a Creator's uploaded document (`creators:review`, enforced at the route layer). */
export async function reviewDocument(reviewerId: string, documentId: string, input: ReviewCreatorDocumentInput) {
  const document = await creatorsRepository.findCreatorDocumentByIdAnyCreator(documentId);
  if (!document) throw new CreatorDocumentNotFoundError();
  if (document.status !== 'PENDING_REVIEW') throw new CreatorDocumentAlreadyReviewedError();

  const updated = await creatorsRepository.reviewCreatorDocument(documentId, reviewerId, input);
  if (!updated) throw new CreatorDocumentNotFoundError();

  const creator = await creatorsRepository.findCreatorById(document.creatorId);
  if (creator) {
    await notificationsService.notify({
      userId: creator.userId,
      type: 'CREATOR_DOCUMENT_REVIEWED',
      title: `Document ${input.status === 'APPROVED' ? 'approved' : 'rejected'}`,
      body:
        input.status === 'APPROVED'
          ? 'One of your submitted documents has been approved.'
          : `One of your submitted documents was rejected.${input.reviewNotes ? ` Reason: ${input.reviewNotes}` : ''}`,
      data: { documentId },
    });
  }

  return updated;
}

// --- Status (admin-only transition) -----------------------------------------

/**
 * Valid onboarding-status transitions. `08-database-design.md` Section 7.1
 * doesn't specify a state machine, so this is a documented Sprint 02
 * assumption: PENDING_REVIEW is the only entry state, REJECTED/CLOSED are
 * terminal, and ACTIVE<->SUSPENDED is the normal operating toggle.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['ACTIVE', 'SUSPENDED'],
  ACTIVE: ['SUSPENDED', 'CLOSED'],
  SUSPENDED: ['ACTIVE', 'CLOSED'],
  REJECTED: [],
  CLOSED: [],
};

export async function transitionCreatorStatus(
  creatorId: string,
  toStatus: 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED',
) {
  const creator = await creatorsRepository.findCreatorById(creatorId);
  if (!creator) throw new CreatorNotFoundError();

  const allowed = VALID_TRANSITIONS[creator.onboardingStatus] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new InvalidCreatorStatusTransitionError(creator.onboardingStatus, toStatus);
  }

  const updated = await creatorsRepository.setCreatorOnboardingStatus(creatorId, toStatus);
  if (!updated) throw new CreatorNotFoundError();

  await notificationsService.notify({
    userId: updated.userId,
    type: 'CREATOR_APPLICATION_STATUS',
    title: 'Your Creator status has changed',
    body: `Your Creator account status is now ${toStatus}.`,
    data: { creatorId, status: toStatus },
  });

  return updated;
}
