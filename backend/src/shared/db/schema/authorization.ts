import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './identity';
import { stores } from './marketplace';

/**
 * Authorization domain — 08-database-design.md Section 6.
 *
 * Deliberately separate from Identity so "who am I" and "what can I do"
 * evolve independently (Section 6, introductory note). RBAC is the primary
 * model (Section 6.8); `resourcePermissions` is the reserved ABAC seam
 * (Section 6.9).
 */

export const roleScopeEnum = pgEnum('role_scope', ['PLATFORM', 'STORE']);

/** 08-database-design.md Section 6.1 — a named bundle of permissions. */
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 64 }).notNull(),
    scope: roleScopeEnum('scope').notNull(),
    description: text('description'),
    isSystemReserved: text('is_system_reserved').notNull().default('true'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('roles_name_scope_unique_idx').on(table.name, table.scope)],
);

/** 08-database-design.md Section 6.2 — an atomic, namespaced capability. */
export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 128 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    isDeprecated: text('is_deprecated').notNull().default('false'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('permissions_key_unique_idx').on(table.key)],
);

/** 08-database-design.md Section 6.3 — grants a Permission to a Role. */
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('role_permissions_unique_idx').on(table.roleId, table.permissionId),
  ],
);

/** 08-database-design.md Section 6.4 — assigns a Role to a User, optionally store-scoped. */
export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    grantedBy: uuid('granted_by').references(() => users.id),
  },
  (table) => [
    uniqueIndex('user_roles_unique_idx').on(table.userId, table.roleId, table.storeId),
    index('user_roles_user_store_idx').on(table.userId, table.storeId),
    index('user_roles_role_idx').on(table.roleId),
  ],
);

/** 08-database-design.md Section 6.5 — fine-grained, per-resource permission overrides (ABAC seam). */
export const resourcePermissions = pgTable(
  'resource_permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    resourceType: varchar('resource_type', { length: 64 }).notNull(),
    resourceId: uuid('resource_id').notNull(),
    permissionKey: varchar('permission_key', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('resource_permissions_lookup_idx').on(
      table.userId,
      table.resourceType,
      table.resourceId,
    ),
  ],
);

/** 08-database-design.md Section 6.7 — append-only grant/revocation history. */
export const permissionAudits = pgTable(
  'permission_audits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actionType: varchar('action_type', { length: 16 }).notNull(), // GRANT | REVOKE
    actorId: uuid('actor_id').references(() => users.id),
    targetUserId: uuid('target_user_id').references(() => users.id),
    roleId: uuid('role_id').references(() => roles.id),
    permissionId: uuid('permission_id').references(() => permissions.id),
    resourceType: varchar('resource_type', { length: 64 }),
    resourceId: uuid('resource_id'),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('permission_audits_target_idx').on(table.targetUserId),
    index('permission_audits_created_at_idx').on(table.createdAt),
  ],
);

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
  store: one(stores, { fields: [userRoles.storeId], references: [stores.id] }),
}));
