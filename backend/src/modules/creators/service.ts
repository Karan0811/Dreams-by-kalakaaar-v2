import { assignRole } from '@/shared/authz/repository';
import * as creatorsRepository from './repository';
import { CreatorApplicationAlreadyExistsError, CreatorApplicationNotFoundError } from './errors';
import type { ApplyAsCreatorInput } from './schemas';

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
