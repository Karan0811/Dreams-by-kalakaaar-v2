import * as usersRepository from './repository';
import { UserProfileNotFoundError } from './errors';
import type { UpdateProfileInput } from './schemas';

/**
 * Users module Service Layer — 10-backend-architecture.md Section 9.
 * Owns the business rules the Route Handler shouldn't know about; the
 * Route Handler only orchestrates auth + validation + calling this.
 */

export async function getMyProfile(userId: string) {
  const profile = await usersRepository.findUserWithProfile(userId);
  if (!profile) throw new UserProfileNotFoundError(userId);
  return profile;
}

export async function updateMyProfile(userId: string, input: UpdateProfileInput) {
  const updated = await usersRepository.updateUserProfile(userId, input);
  if (!updated) throw new UserProfileNotFoundError(userId);
  return usersRepository.findUserWithProfile(userId);
}
