// import "server-only";
// import { Pool } from "pg";
// import { betterAuth } from "better-auth";
// import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

// /**
//  * Single Better Auth instance configuration, consumed identically by
//  * apps/buyer, apps/creator (and, in a future sprint, apps/internal), per
//  * 11-frontend-architecture.md §12.1. Better Auth issues an httpOnly, secure,
//  * sameSite=lax session cookie on each app's domain — the browser never holds
//  * a raw API Bearer token (10.1's BFF security rationale).
//  *
//  * Each app's own `app/api/auth/[...all]/route.ts` imports `auth` from here
//  * and mounts Better Auth's handler; no app redefines auth configuration
//  * independently.
//  *
//  * FIX (production audit): this instance previously had no `database` option
//  * at all, so Better Auth had nothing to persist users/sessions/verification
//  * tokens to — sign-up, sign-in, and password reset would all fail at
//  * runtime the first time they touched storage. Better Auth accepts a raw
//  * driver instance directly (no separate ORM/adapter needed for pg/mysql2/
//  * better-sqlite3), so we hand it a `pg.Pool` pointed at the same Supabase
//  * Postgres instance the rest of the stack uses (08-database-design.md).
//  * Better Auth's own tables (user/session/account/verification) are separate
//  * from the marketplace's application schema — run
//  * `npx @better-auth/cli generate` (or the equivalent Drizzle migration)
//  * against DATABASE_URL once, per the README, before relying on auth in a
//  * real environment.
//  */
// const globalForAuth = globalThis as typeof globalThis & {
//   __dbkBetterAuthPool?: Pool;
// };

// /** Keep one pool per running Next.js process, including during development HMR. */
// const databasePool =
//   globalForAuth.__dbkBetterAuthPool ??
//   new Pool({
//     connectionString: process.env.DATABASE_URL,
//   });

// if (process.env.NODE_ENV !== "production") {
//   globalForAuth.__dbkBetterAuthPool = databasePool;
// }

// const hasGoogleOAuthConfigured = Boolean(
//   process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
// );

// export const auth = betterAuth({
//   secret: process.env.BETTER_AUTH_SECRET,
//   baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
//   trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",").filter(Boolean),
//   database: databasePool,
//   session: {
//     expiresIn: 60 * 60 * 24 * 30, // 30 days
//     updateAge: 60 * 60 * 24, // refresh once per day of activity
//     cookieCache: {
//       enabled: true,
//       maxAge: 60 * 5, // 5 minutes, per 9.10's client-snapshot-only caching rule
//     },
//   },
//   emailAndPassword: {
//     enabled: true,
//     requireEmailVerification: true,
//     // FIX: was 10, which is *weaker* than the backend's own passwordSchema
//     // (`shared/validation/common-schemas.ts`, min 12). A 10–11 character
//     // password would pass Better Auth's sign-up (creating a real Better
//     // Auth account) and then fail the backend's `/v1/auth/register` call
//     // that bridges it (`access-token.ts`'s `bridgeBackendRegistration`),
//     // leaving a Better-Auth-only account with no matching backend user —
//     // permanently broken, since every BFF route requires the backend JWT.
//     // Must stay >= the backend's minimum; keeping them equal (12) avoids
//     // rejecting a password the frontend already accepted.
//     minPasswordLength: 12,
//     // FIX: `requireEmailVerification: true` with no `sendResetPassword`
//     // callback means Better Auth has no way to actually deliver a reset
//     // link — the Forgot Password screen (07-ui-screens-wireframes.md §4.4)
//     // would silently do nothing. Wired to send via SMTP or Resend — see
//     // ./email.ts for which one actually fires and why.
//     sendResetPassword: async ({ user, url }) => {
//       await sendPasswordResetEmail({ to: user.email, resetUrl: url });
//     },
//   },
//   emailVerification: {
//     // FIX: required once `requireEmailVerification` is true — otherwise a
//     // newly signed-up user has no way to ever complete verification and is
//     // permanently stuck.
//     sendVerificationEmail: async ({ user, url }) => {
//       await sendVerificationEmail({ to: user.email, verificationUrl: url });
//     },
//     sendOnSignUp: true,
//     autoSignInAfterVerification: true,
//   },
//   // FIX (production audit): `roles` and `hasCreatorProfile` were read off
//   // the Better Auth user object in session.ts via an unchecked `as unknown`
//   // cast, but nothing ever told Better Auth these columns existed — they
//   // were never actually persisted. Declaring them here makes them real,
//   // migrated columns (via `npx @better-auth/cli generate`) with real
//   // defaults, which is what session.ts now reads.
//   user: {
//     additionalFields: {
//       roles: {
//         type: "string",
//         required: false,
//         defaultValue: JSON.stringify(["buyer"]),
//         // Not settable by the client at signup — only backend processes
//         // (e.g., creator approval) should ever change this.
//         input: false,
//       },
//       hasCreatorProfile: {
//         type: "boolean",
//         required: false,
//         defaultValue: false,
//         input: false,
//       },
//     },
//   },
//   // Third-party sign-in (Google) is enabled per 07-ui-screens-wireframes.md
//   // §4.1/4.2 "third-party sign-in options", but only registered when both
//   // env vars are actually present — passing empty-string credentials to
//   // Better Auth previously meant an always-configured-but-broken Google
//   // button in every environment that hasn't set up OAuth yet.
//   socialProviders: hasGoogleOAuthConfigured
//     ? {
//         google: {
//           clientId: process.env.GOOGLE_CLIENT_ID!,
//           clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//         },
//       }
//     : undefined,
// });

// export type Auth = typeof auth;

import "server-only";
import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

/**
 * Single Better Auth instance configuration, consumed identically by
 * apps/buyer, apps/creator (and, in a future sprint, apps/internal), per
 * 11-frontend-architecture.md §12.1. Better Auth issues an httpOnly, secure,
 * sameSite=lax session cookie on each app's domain — the browser never holds
 * a raw API Bearer token (10.1's BFF security rationale).
 *
 * Each app's own `app/api/auth/[...all]/route.ts` imports `auth` from here
 * and mounts Better Auth's handler; no app redefines auth configuration
 * independently.
 *
 * FIX (production audit): this instance previously had no `database` option
 * at all, so Better Auth had nothing to persist users/sessions/verification
 * tokens to — sign-up, sign-in, and password reset would all fail at
 * runtime the first time they touched storage. Better Auth accepts a raw
 * driver instance directly (no separate ORM/adapter needed for pg/mysql2/
 * better-sqlite3), so we hand it a `pg.Pool` pointed at the same Supabase
 * Postgres instance the rest of the stack uses (08-database-design.md).
 * Better Auth's own tables (user/session/account/verification) are separate
 * from the marketplace's application schema — run
 * `npx @better-auth/cli generate` (or the equivalent Drizzle migration)
 * against DATABASE_URL once, per the README, before relying on auth in a
 * real environment.
 */
const globalForAuth = globalThis as typeof globalThis & {
  __dbkBetterAuthPool?: Pool;
};

/** Keep one pool per running Next.js process, including during development HMR. */
const databasePool =
  globalForAuth.__dbkBetterAuthPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuth.__dbkBetterAuthPool = databasePool;
}

const hasGoogleOAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",").filter(Boolean),
  database: databasePool,
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes, per 9.10's client-snapshot-only caching rule
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // FIX: was 10, which is *weaker* than the backend's own passwordSchema
    // (`shared/validation/common-schemas.ts`, min 12). A 10–11 character
    // password would pass Better Auth's sign-up (creating a real Better
    // Auth account) and then fail the backend's `/v1/auth/register` call
    // that bridges it (`access-token.ts`'s `bridgeBackendRegistration`),
    // leaving a Better-Auth-only account with no matching backend user —
    // permanently broken, since every BFF route requires the backend JWT.
    // Must stay >= the backend's minimum; keeping them equal (12) avoids
    // rejecting a password the frontend already accepted.
    minPasswordLength: 12,
    // FIX: `requireEmailVerification: true` with no `sendResetPassword`
    // callback means Better Auth has no way to actually deliver a reset
    // link — the Forgot Password screen (07-ui-screens-wireframes.md §4.4)
    // would silently do nothing. Wired to send via SMTP or Resend — see
    // ./email.ts for which one actually fires and why.
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ to: user.email, resetUrl: url });
    },
  },
  emailVerification: {
    // Left wired (not removed) because Better Auth's password-reset and
    // manual resend flows can still call this internally even with
    // `sendOnSignUp: false` below — but it's no longer this app's primary
    // verification path. See `requireEmailVerification`'s doc comment above
    // and `VerifyEmailPanel.tsx` for the real, functional verification flow.
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ to: user.email, verificationUrl: url });
    },
    // FIX (Q8): was `true`, firing a second, separate verification email
    // (Better-Auth-native token, this app's own disconnected `user` table)
    // alongside the backend's own — confusing, and only one of the two
    // links ever actually worked. The backend's `register()` call is now
    // the single source of a working verification email.
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },
  // FIX (production audit): `roles` and `hasCreatorProfile` were read off
  // the Better Auth user object in session.ts via an unchecked `as unknown`
  // cast, but nothing ever told Better Auth these columns existed — they
  // were never actually persisted. Declaring them here makes them real,
  // migrated columns (via `npx @better-auth/cli generate`) with real
  // defaults, which is what session.ts now reads.
  user: {
    additionalFields: {
      roles: {
        type: "string",
        required: false,
        defaultValue: JSON.stringify(["buyer"]),
        // Not settable by the client at signup — only backend processes
        // (e.g., creator approval) should ever change this.
        input: false,
      },
      hasCreatorProfile: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  // Third-party sign-in (Google) is enabled per 07-ui-screens-wireframes.md
  // §4.1/4.2 "third-party sign-in options", but only registered when both
  // env vars are actually present — passing empty-string credentials to
  // Better Auth previously meant an always-configured-but-broken Google
  // button in every environment that hasn't set up OAuth yet.
  socialProviders: hasGoogleOAuthConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,
});

export type Auth = typeof auth;