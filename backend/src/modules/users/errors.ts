import { NotFoundError } from '@/shared/errors/base-errors';

export class UserProfileNotFoundError extends NotFoundError {
  constructor(userId: string) {
    super(`No profile exists for user ${userId}.`);
  }
}
