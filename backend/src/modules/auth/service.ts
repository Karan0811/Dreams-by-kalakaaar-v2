import { auth } from '@/shared/auth/better-auth.config';
import { hashPassword, verifyPassword } from '@/shared/auth/password';
import { isPasswordBreached } from '@/shared/auth/breach-check';
import { issueAccessToken } from '@/shared/auth/jwt';
import {
  issueRefreshToken,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from '@/shared/auth/refresh-token';
import { assignRole, loadEffectivePermissions } from '@/shared/authz/repository';
import { passwordResetEmail, sendEmail, verificationEmail } from '@/shared/email/client';
import { createModuleLogger } from '@/shared/observability/logger';
import * as usersRepository from '@/modules/users/repository';
import * as authRepository from './repository';
import {
  AccountNotActiveError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidOrExpiredTokenError,
  PasswordBreachedError,
} from './errors';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,

} from './schemas';

const logger = createModuleLogger('auth.service');

const EMAIL_VERIFICATION_TTL_MINUTES = 24 * 60;
const PASSWORD_RESET_TTL_MINUTES = 30;

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

async function issueTokenPairForSession(params: {
  userId: string;
  email: string;
  sessionToken: string;
}): Promise<AuthTokenPair> {
  const session = await authRepository.findSessionByToken(params.sessionToken);
  if (!session) {
    // Should be unreachable — Better Auth just created this session row.
    throw new InvalidCredentialsError();
  }

  const { roleNames } = await loadEffectivePermissions(params.userId);

  const accessToken = await issueAccessToken({
    userId: params.userId,
    email: params.email,
    roles: roleNames,
    sessionId: session.id,
  });

  const { rawToken: refreshToken, expiresAt: refreshTokenExpiresAt } = await issueRefreshToken({
    userId: params.userId,
    sessionId: session.id,
  });

  return { accessToken, refreshToken, refreshTokenExpiresAt };
}

export async function register(input: RegisterInput) {
  const existing = await authRepository.findUserByEmail(input.email);
  
  // Idempotent registration: if user already exists in our database,
  // verify the password matches and proceed with login flow instead.
  // This handles the case where Better Auth (frontend) already created
  // the user, and we're being called as a bridge to sync/issue tokens.
  if (existing) {
    // Verify credentials match before allowing bridge registration
    const account = await authRepository.findCredentialAccount(existing.id);
    if (!account?.passwordHash) {
      throw new EmailAlreadyRegisteredError();
    }

    const isValid = await verifyPassword(account.passwordHash, input.password);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // User exists and credentials match - treat as login
    let signInResult;
    try {
      signInResult = await auth.api.signInEmail({
        body: { email: input.email, password: input.password },
      });
    } catch {
      throw new InvalidCredentialsError();
    }

    const tokens = await issueTokenPairForSession({
      userId: existing.id,
      email: existing.email,
      sessionToken: signInResult.token ?? '',
    });

    return { user: signInResult.user, ...tokens };
  }

  if (await isPasswordBreached(input.password)) {
    throw new PasswordBreachedError();
  }

  // NOTE: Better Auth's signUpEmail call and the two writes that follow
  // (user profile, default role grant) are not wrapped in one Postgres
  // transaction — Better Auth's adapter owns its own connection, not this
  // module's `db` handle. If the profile/role step fails after the user
  // row is created, the user exists but is missing a profile/role; this is
  // logged loudly so it's operationally visible, and re-running
  // `register` for the same email would surface as "already registered"
  // rather than silently retrying — an accepted trade-off of integrating a
  // third-party auth SDK that manages its own persistence boundary.
  const signUpResult = await auth.api.signUpEmail({
    body: { email: input.email, password: input.password, name: input.displayName },
  });

  try {
    await usersRepository.createUserProfile({
      userId: signUpResult.user.id,
      displayName: input.displayName,
    });
    await assignRole({ userId: signUpResult.user.id, roleName: 'Buyer' });
  } catch (error) {
    logger.error('Post-signup provisioning failed (profile/role grant)', error, {
      userId: signUpResult.user.id,
    });
    throw error;
  }

  const rawVerificationToken = await authRepository.createEmailVerification({
    userId: signUpResult.user.id,
    targetEmail: input.email,
    ttlMinutes: EMAIL_VERIFICATION_TTL_MINUTES,
  });
  await sendEmail({
    to: input.email,
    subject: 'Confirm your email — Dreams by Kalakaaar',
    html: verificationEmail(rawVerificationToken),
  });

  const tokens = await issueTokenPairForSession({
    userId: signUpResult.user.id,
    email: input.email,
    sessionToken: signUpResult.token ?? '',
  });

  return { user: signUpResult.user, ...tokens };
}

export async function login(input: LoginInput) {
  const user = await authRepository.findUserByEmail(input.email);
  if (!user) throw new InvalidCredentialsError();

  if (user.status === 'SUSPENDED' || user.status === 'BANNED' || user.status === 'DEACTIVATED') {
    throw new AccountNotActiveError();
  }

  let signInResult;
  try {
    signInResult = await auth.api.signInEmail({
      body: { email: input.email, password: input.password },
    });
  } catch {
    throw new InvalidCredentialsError();
  }

  const tokens = await issueTokenPairForSession({
    userId: user.id,
    email: user.email,
    sessionToken: signInResult.token ?? '',
  });

  return { user: signInResult.user, ...tokens };
}

export async function logout(refreshToken: string, sessionId?: string): Promise<void> {
  await revokeRefreshToken(refreshToken);
  if (sessionId) {
    await authRepository.revokeSession(sessionId);
  }
}

export async function refresh(refreshToken: string): Promise<AuthTokenPair & { userId: string }> {
  const rotated = await rotateRefreshToken(refreshToken);

  if (rotated.sessionId) {
    const session = await authRepository.findSessionById(rotated.sessionId);
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new InvalidOrExpiredTokenError('refresh');
    }
  }

  const user = await authRepository.findUserById(rotated.userId);
  if (!user) throw new InvalidOrExpiredTokenError('refresh');

  const { roleNames } = await loadEffectivePermissions(user.id);
  const accessToken = await issueAccessToken({
    userId: user.id,
    email: user.email,
    roles: roleNames,
    sessionId: rotated.sessionId ?? '',
  });

  return {
    userId: user.id,
    accessToken,
    refreshToken: rotated.rawToken,
    refreshTokenExpiresAt: rotated.expiresAt,
  };
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const account = await authRepository.findCredentialAccount(userId);
  if (!account?.passwordHash) throw new InvalidCredentialsError();

  const isValid = await verifyPassword(account.passwordHash, input.currentPassword);
  if (!isValid) throw new InvalidCredentialsError();

  if (await isPasswordBreached(input.newPassword)) {
    throw new PasswordBreachedError();
  }

  const newHash = await hashPassword(input.newPassword);
  await authRepository.updateCredentialPasswordHash(userId, newHash);

  // Force re-authentication everywhere else (12-security-architecture.md
  // Section 5.4's principle: a password change invalidates prior sessions).
  await revokeAllRefreshTokensForUser(userId);
  await authRepository.revokeAllSessionsForUser(userId);
}

/**
 * Always succeeds from the caller's perspective regardless of whether the
 * email is registered, to avoid account-enumeration via response timing/
 * content (standard practice; no email is sent for an unknown address).
 */
export async function forgotPassword(email: string, requestingIp?: string): Promise<void> {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    logger.info('Password reset requested for unknown email (no-op)', { requestingIp });
    return;
  }

  const rawToken = await authRepository.createPasswordReset({
    userId: user.id,
    requestingIp,
    ttlMinutes: PASSWORD_RESET_TTL_MINUTES,
  });

  await sendEmail({
    to: user.email,
    subject: 'Reset your password — Dreams by Kalakaaar',
    html: passwordResetEmail(rawToken),
  });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const resetRow = await authRepository.consumePasswordReset(input.token);
  if (!resetRow) throw new InvalidOrExpiredTokenError('password reset');

  if (await isPasswordBreached(input.newPassword)) {
    throw new PasswordBreachedError();
  }

  const newHash = await hashPassword(input.newPassword);
  await authRepository.updateCredentialPasswordHash(resetRow.userId, newHash);
  await revokeAllRefreshTokensForUser(resetRow.userId);
  await authRepository.revokeAllSessionsForUser(resetRow.userId);
}

export async function verifyEmail(token: string): Promise<void> {
  const verificationRow = await authRepository.consumeEmailVerification(token);
  if (!verificationRow) throw new InvalidOrExpiredTokenError('verification');

  await authRepository.markUserEmailVerified(verificationRow.userId);
}

/**
 * Resends a verification email to the user. Always succeeds from the caller's
 * perspective regardless of whether the email is registered, to avoid account
 * enumeration via response timing/content (standard practice; no email is sent
 * for an unknown address or already verified address).
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    logger.info('Verification email requested for unknown email (no-op)', { email });
    return;
  }

  if (user.emailVerified) {
    logger.info('Verification email requested for already verified email (no-op)', { email });
    return;
  }

  const rawVerificationToken = await authRepository.createEmailVerification({
    userId: user.id,
    targetEmail: email,
    ttlMinutes: EMAIL_VERIFICATION_TTL_MINUTES,
  });
  await sendEmail({
    to: email,
    subject: 'Confirm your email — Dreams by Kalakaaar',
    html: verificationEmail(rawVerificationToken),
  });
}

export async function getMe(userId: string) {
  const user = await authRepository.findUserById(userId);
  if (!user) throw new InvalidCredentialsError();

  const { roleNames } = await loadEffectivePermissions(userId);

  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    status: user.status,
    roles: roleNames,
    createdAt: user.createdAt,
  };
}
