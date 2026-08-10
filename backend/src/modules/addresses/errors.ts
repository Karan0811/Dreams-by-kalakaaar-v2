import { NotFoundError } from '@/shared/errors/base-errors';

export class UserAddressNotFoundError extends NotFoundError {
  constructor() {
    super('Address not found.');
  }
}
