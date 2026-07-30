import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/shared/db/client';
import {
  authenticationAccounts,
  betterAuthVerifications,
  sessions,
  users,
} from '@/shared/db/schema';
import { env } from '@/shared/config/env';

/**
 * Better Auth configuration — 10-backend-architecture.md Section 7.
 *
 * Better Auth is the system of record for credential storage and session
 * lifecycle; the tables below (all defined in `shared/db/schema/identity.ts`)
 * are the durable Postgres representation its adapter reads and writes
 * (08-database-design.md Section 5's framing). Field-name aliases exist
 * because this schema's column names follow this project's own naming
 * conventions (Section 26's Engineering Standards) rather than Better
 * Auth's internal defaults — Better Auth's field-mapping config is exactly
 * the documented mechanism for reconciling the two without forking either.
 *
 * Password hashing: Better Auth's built-in `emailAndPassword` provider uses
 * scrypt by default. 12-security-architecture.md Section 5.2 mandates
 * Argon2id specifically, so a custom `password.hash`/`password.verify` pair
 * backed by Argon2id (`shared/auth/password.ts`) is supplied below,
 * overriding the default.
 *
 * Email verification and password reset are deliberately NOT delegated to
 * Better Auth's built-in flows — see `betterAuthVerifications`'s doc comment
 * in `identity.ts` for why the Auth module owns those against its own
 * richer tables instead.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: authenticationAccounts,
      verification: betterAuthVerifications,
    },
  }),
  user: {
    modelName: 'user',
    fields: {
      name: 'name',
      email: 'email',
      emailVerified: 'emailVerified',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  session: {
    modelName: 'session',
    fields: {
      userId: 'userId',
      token: 'token',
      expiresAt: 'expiresAt',
      ipAddress: 'ipAddress',
      userAgent: 'userAgent',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
    updateAge: 60 * 60 * 24, // refresh the session row once per day of activity
  },
  account: {
    modelName: 'account',
    fields: {
      userId: 'userId',
      accountId: 'providerAccountId',
      providerId: 'provider',
      password: 'passwordHash',
      accessToken: 'accessTokenEncrypted',
      refreshToken: 'refreshTokenEncrypted',
      idToken: 'idToken',
      accessTokenExpiresAt: 'providerTokenExpiresAt',
      createdAt: 'linkedAt',
      updatedAt: 'updatedAt',
    },
  },
  emailAndPassword: {
    enabled: true,
    // Our own flow owns verification-email dispatch (modules/auth/service.ts);
    // Better Auth is not asked to send it.
    autoSignInAfterVerification: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    password: {
      hash: async (password: string) => {
        const { hashPassword } = await import('./password');
        return hashPassword(password);
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        const { verifyPassword } = await import('./password');
        return verifyPassword(hash, password);
      },
    },
  },
  advanced: {
    // Let Postgres generate primary keys via each table's `defaultRandom()`
    // (`gen_random_uuid()`) rather than Better Auth's own nanoid-style ID
    // generator — every `id` column in this schema is `uuid`, matching the
    // rest of the codebase's convention (10-backend-architecture.md
    // Section 26.3).
    generateId: false,
    // Access/refresh-token issuance for API clients is this project's own
    // asymmetric-JWT scheme (09-api-architecture.md Section 3.1), issued by
    // modules/auth/service.ts on top of the Better Auth session created
    // here — not Better Auth's own cookie-only session token.
    disableCSRFCheck: false,
  },
});

export type AuthInstance = typeof auth;
