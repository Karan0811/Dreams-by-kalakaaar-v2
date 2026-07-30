import { ConflictError, NotFoundError } from '@/shared/errors/base-errors';

export class CreatorApplicationAlreadyExistsError extends ConflictError {
  constructor() {
    super('An application already exists for this account.');
  }
}

export class CreatorApplicationNotFoundError extends NotFoundError {
  constructor() {
    super('No Creator application exists for this account.');
  }
}
