import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Identity domain — 08-database-design.md Section 5.
 *
 * Answers exactly one question, "who is this, technically?" — no business
 * role (Authorization domain, authorization.ts) and no marketplace-facing
 * profile content (marketplace.ts's Store/Creator) lives here.
 */

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'BANNED',
  'DEACTIVATED',
  'PENDING_DELETION',
  'PENDING_EMAIL_VERIFICATION',
]);

/**
 * NOTE: `authenticationAccounts.provider` is deliberately `varchar`, not a
 * Postgres enum. Better Auth (not this schema) owns the vocabulary of
 * provider-id values it writes here — e.g. `"credential"` for email/password,
 * `"google"`, `"apple"` — and that vocabulary can grow as OAuth providers are
 * added without a schema migration.
 */

/** 08-database-design.md Section 5.1 — the single canonical identity row. */
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 254 }).notNull(),
    /**
     * Better Auth's core `user` model requires a flat `name` field on the
     * same row as `email`/`emailVerified`. The Identity domain's
     * human-facing display data otherwise lives on `userProfiles`
     * (Section 5.2) — this column exists solely so Better Auth's adapter
     * has a single table to read/write for its own bookkeeping, and the
     * Auth Service keeps it in sync with `userProfiles.displayName` on
     * every write. Application code should read `userProfiles.displayName`,
     * never this column, for anything user-facing.
     */
    name: varchar('name', { length: 50 }).notNull().default(''),
    emailVerified: boolean('email_verified').notNull().default(false),
    phone: varchar('phone', { length: 32 }),
    phoneVerified: boolean('phone_verified').notNull().default(false),
    status: userStatusEnum('status').notNull().default('PENDING_EMAIL_VERIFICATION'),
    locale: varchar('locale', { length: 16 }).notNull().default('en-IN'),
    timezone: varchar('timezone', { length: 64 }).notNull().default('Asia/Kolkata'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('users_email_unique_idx').on(table.email),
    index('users_status_idx').on(table.status),
    index('users_created_at_idx').on(table.createdAt),
  ],
);

/** 08-database-design.md Section 5.2 — shared human-facing profile attributes. */
export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 50 }).notNull(),
  avatarMediaId: uuid('avatar_media_id'),
  bio: varchar('bio', { length: 500 }),
  pronouns: varchar('pronouns', { length: 32 }),
  isPublicProfile: boolean('is_public_profile').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** 08-database-design.md Section 5.3 — one authentication method for a User. */
export const authenticationAccounts = pgTable(
  'authentication_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 32 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    /** Argon2id hash (12-security-architecture.md Section 5.2). Never populated for OAuth providers. */
    passwordHash: text('password_hash'),
    /** Encrypted OAuth provider tokens (Section 7.8) — null for the PASSWORD provider. */
    accessTokenEncrypted: text('access_token_encrypted'),
    refreshTokenEncrypted: text('refresh_token_encrypted'),
    idToken: text('id_token'),
    providerTokenExpiresAt: timestamp('provider_token_expires_at', { withTimezone: true }),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('auth_accounts_provider_account_unique_idx').on(
      table.provider,
      table.providerAccountId,
    ),
    index('auth_accounts_user_id_idx').on(table.userId),
  ],
);

/** 08-database-design.md Section 5.4 — an active, authenticated session. */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deviceId: uuid('device_id'),
    /** Opaque session token issued to the client (hashed at rest is a future hardening step; Better Auth manages this value). */
    token: varchar('token', { length: 512 }).notNull(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('sessions_token_unique_idx').on(table.token),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

/** 08-database-design.md Section 5.5 — rotating, hashed, single-use refresh token. */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
    /** SHA-256 hash of the opaque token; the raw token is never stored. */
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    /** Rotation lineage marker — 08-database-design.md Section 5.5's reuse-detection design. */
    rotatedFromId: uuid('rotated_from_id'),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('refresh_tokens_hash_unique_idx').on(table.tokenHash),
    index('refresh_tokens_user_id_idx').on(table.userId),
    index('refresh_tokens_expires_at_idx').on(table.expiresAt),
  ],
);

/** 08-database-design.md Section 5.6 — time-boxed email-ownership proof. */
export const emailVerifications = pgTable(
  'email_verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetEmail: varchar('target_email', { length: 254 }).notNull(),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('email_verifications_user_id_idx').on(table.userId),
    index('email_verifications_expires_at_idx').on(table.expiresAt),
  ],
);

/** 08-database-design.md Section 5.8 — time-boxed password-reset authorization. */
export const passwordResets = pgTable(
  'password_resets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    requestingIp: varchar('requesting_ip', { length: 64 }),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('password_resets_user_id_idx').on(table.userId),
    index('password_resets_expires_at_idx').on(table.expiresAt),
  ],
);

/** 08-database-design.md Section 5.10 — device fingerprints seen for a User. */
export const devices = pgTable(
  'devices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fingerprintHash: varchar('fingerprint_hash', { length: 128 }).notNull(),
    deviceName: varchar('device_name', { length: 128 }),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (table) => [
    index('devices_user_id_idx').on(table.userId),
    index('devices_fingerprint_idx').on(table.fingerprintHash),
  ],
);

/**
 * Better Auth's own generic verification-token table.
 *
 * The Auth module's `verify-email` and `forgot-password`/`reset-password`
 * business flows are implemented against our purpose-built
 * `emailVerifications`/`passwordResets` tables above (which carry
 * attempt-count and requesting-IP fields those flows' abuse-prevention
 * rules need — 12-security-architecture.md Section 5.6 — that Better
 * Auth's generic model doesn't). This table exists only so Better Auth's
 * own schema contract (`shared/auth/better-auth.config.ts`) is complete;
 * nothing in this codebase's business logic reads or writes it directly.
 */
export const betterAuthVerifications = pgTable(
  'better_auth_verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('better_auth_verifications_identifier_idx').on(table.identifier)],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  authenticationAccounts: many(authenticationAccounts),
  sessions: many(sessions),
  refreshTokens: many(refreshTokens),
  devices: many(devices),
}));

export const authenticationAccountsRelations = relations(authenticationAccounts, ({ one }) => ({
  user: one(users, { fields: [authenticationAccounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
  refreshTokens: many(refreshTokens),
}));
