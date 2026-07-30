import { AuthenticationError, ConflictError, ValidationError } from '@/shared/errors/base-errors';

export class EmailAlreadyRegisteredError extends ConflictError {
  constructor() {
    super('An account with this email address already exists.');
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Email or password is incorrect.');
  }
}

export class PasswordBreachedError extends ValidationError {
  constructor() {
    super(
      'This password has appeared in a known data breach. Please choose a different password.',
      [{ field: 'password', issue: 'appears in a known data breach' }],
    );
  }
}

export class InvalidOrExpiredTokenError extends AuthenticationError {
  constructor(tokenType: 'verification' | 'password reset' | 'refresh') {
    super(`This ${tokenType} token is invalid or has expired.`);
  }
}

export class AccountNotActiveError extends AuthenticationError {
  constructor() {
    super('This account is suspended, banned, or deactivated.');
  }
}
