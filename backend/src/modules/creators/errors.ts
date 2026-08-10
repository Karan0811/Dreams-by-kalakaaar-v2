import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors/base-errors';

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

/** Sprint 02 additions. */
export class CreatorNotFoundError extends NotFoundError {
  constructor() {
    super('Creator not found.');
  }
}

export class CreatorAddressNotFoundError extends NotFoundError {
  constructor() {
    super('Creator address not found.');
  }
}

export class CreatorBankDetailsNotFoundError extends NotFoundError {
  constructor() {
    super('Creator bank details not found.');
  }
}

export class CreatorSocialLinkNotFoundError extends NotFoundError {
  constructor() {
    super('Creator social link not found.');
  }
}

export class CreatorDocumentNotFoundError extends NotFoundError {
  constructor() {
    super('Creator document not found.');
  }
}

export class CreatorDocumentAlreadyReviewedError extends ConflictError {
  constructor() {
    super('This document has already been reviewed.');
  }
}

export class InvalidCreatorStatusTransitionError extends ValidationError {
  constructor(from: string, to: string) {
    super(`Cannot transition Creator onboarding status from ${from} to ${to}.`, undefined, 422);
  }
}
