# Authentication audit — 2026-08-07

## Implemented fixes

| Finding | Resolution |
| --- | --- |
| Buyer pointed Better Auth to backend port `3000` while it runs on `3002`. | Corrected buyer example environment URLs and allowed both frontend origins. |
| `/verify-email` was not implemented. | Added a verification screen with loading, success, invalid/expired/error states, and enumeration-safe resend. |
| Password-reset email callbacks targeted missing routes. | Added the Better Auth callback bridge at `/reset-password/[token]` and a reset form with invalid/expired and success states. |
| Buyer `/become-a-creator` was missing. | Added a compatibility redirect to the creator app. |
| Creator password recovery was absent. | Added a link to the buyer-owned shared recovery flow. |
| Development hot reload could create multiple frontend `pg` pools. | Reused one pool per frontend process through `globalThis`. |
| Verification did not explicitly establish a session. | Enabled Better Auth `autoSignInAfterVerification`. |

Google OAuth remains conditional: the provider is created only when both credentials are present, so no broken provider is registered when they are absent. The current forms do not render a Google button, which is therefore correctly hidden in unconfigured environments.

## Important architecture finding

`backend/src/shared/auth/better-auth.config.ts` is a second Better Auth system.
It uses backend-specific identity tables, Argon2 password storage, API JWTs, and refresh tokens; the frontend shared package uses Better Auth's standard `user`, `session`, `account`, and `verification` schema and cookie sessions. This is the root cause of identities created in one system not being available to the other. It cannot be removed safely as a hotfix: doing so requires a planned identity migration, a compatibility period for existing passwords/tokens, and changing the backend authentication middleware/API contract.

The buyer and creator apps themselves now share one configuration source, database migration, secret, and trusted-origin set. Both `.env.local` files must use the same `DATABASE_URL` and `BETTER_AUTH_SECRET`.

## Verification results

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Frontend TypeScript | PASS | `npm run type-check` completed successfully. |
| Buyer lint | PASS with existing warnings | No lint errors; repository has existing warnings. |
| Buyer production build | BLOCKED | Sandbox DNS cannot resolve `fonts.googleapis.com` for `next/font`. |
| Static route coverage | PASS | `/verify-email`, `/reset-password`, `/reset-password/[token]`, and buyer `/become-a-creator` now exist. |
| Database/auth E2E | BLOCKED | No runnable shared PostgreSQL/Supabase credentials or email provider are available in this workspace. |
| Signup, duplicate signup, login, logout, session refresh/expiry, cross-app login | BLOCKED | Require the shared database and live frontend processes. |
| Verification/resend/invalid/expired flows | BLOCKED | Require a generated token and email delivery/log capture. |
| Password reset/new-password/old-password rejection | BLOCKED | Require a generated reset token and shared database. |
| Google OAuth | BLOCKED | Requires configured Google credentials and callback URLs. |
| Backend API auth regression | NOT RUN | Separate backend identity system; requires its own environment and migration state. |

## Release checklist

1. Apply `packages/auth/migrations/0001_better_auth_schema.sql` to the shared frontend-auth database.
2. Set identical `BETTER_AUTH_SECRET` and `DATABASE_URL` in buyer and creator `.env.local` files.
3. Start buyer on `3002` and creator on `3001`, then run the blocked E2E cases against a disposable database/mailbox.
4. Plan the backend/frontend identity consolidation before claiming a single system of record across the entire platform.
