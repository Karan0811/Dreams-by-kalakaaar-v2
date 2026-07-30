import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { permissions, rolePermissions, roles, userRoles } from '@/shared/db/schema';

/**
 * Authorization (RBAC) repository — 08-database-design.md Section 6.
 *
 * Deliberately lives under `shared/`, not inside any one module: every
 * module's Route Handlers call the same `authorize` middleware
 * (`shared/middleware/authorize.ts`), which calls this repository, per
 * 10-backend-architecture.md's framing that "who can do what" is a
 * cross-cutting platform concern rather than any single module's property.
 */

export interface EffectivePermissions {
  roleNames: string[];
  permissionKeys: Set<string>;
}

/**
 * Loads every permission a user holds, resolved through both their
 * platform-scoped roles and any store-scoped roles for the given store
 * (08-database-design.md Section 6.4 — `storeId IS NULL` rows are
 * platform-wide grants).
 */
export async function loadEffectivePermissions(
  userId: string,
  storeId?: string,
): Promise<EffectivePermissions> {
  const assignments = await db
    .select({ roleId: userRoles.roleId, roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        storeId
          ? or(isNull(userRoles.storeId), eq(userRoles.storeId, storeId))
          : isNull(userRoles.storeId),
      ),
    );

  if (assignments.length === 0) {
    return { roleNames: [], permissionKeys: new Set() };
  }

  const roleIds = assignments.map((a) => a.roleId);

  const grants = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(inArray(rolePermissions.roleId, roleIds));

  return {
    roleNames: assignments.map((a) => a.roleName),
    permissionKeys: new Set(grants.map((g) => g.key)),
  };
}

export async function assignRole(params: {
  userId: string;
  roleName: string;
  storeId?: string;
  grantedBy?: string;
}): Promise<void> {
  const [role] = await db.select().from(roles).where(eq(roles.name, params.roleName)).limit(1);

  if (!role) {
    throw new Error(`Role "${params.roleName}" does not exist. Seed data may be out of date.`);
  }

  await db
    .insert(userRoles)
    .values({
      userId: params.userId,
      roleId: role.id,
      storeId: params.storeId,
      grantedBy: params.grantedBy,
    })
    .onConflictDoNothing();
}
