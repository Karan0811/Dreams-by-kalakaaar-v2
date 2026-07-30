import type { SessionUser, UserRole } from "@dbk/types";

/**
 * Permission keys follow a `resource:action` convention, matching the
 * `usePermission('creator:suspend')`-style call sites described in
 * 11-frontend-architecture.md §12.6. This table is UX-layer gating only —
 * the backend API's own permission check (09-api-architecture.md §2.3, 403
 * model) is always the authoritative enforcement point.
 */
export type PermissionKey =
  | "creator:access-dashboard"
  | "creator:manage-products"
  | "creator:manage-orders"
  | "buyer:checkout"
  | "buyer:manage-account";

const rolePermissions: Record<UserRole, PermissionKey[]> = {
  buyer: ["buyer:checkout", "buyer:manage-account"],
  creator: [
    "creator:access-dashboard",
    "creator:manage-products",
    "creator:manage-orders",
    "buyer:checkout",
    "buyer:manage-account",
  ],
  admin: [],
  moderator: [],
  support: [],
};

export function resolvePermissions(user: SessionUser | null): Set<PermissionKey> {
  if (!user) return new Set();
  const permissions = new Set<PermissionKey>();
  for (const role of user.roles) {
    for (const permission of rolePermissions[role] ?? []) {
      permissions.add(permission);
    }
  }
  return permissions;
}

export function hasPermission(user: SessionUser | null, permission: PermissionKey): boolean {
  return resolvePermissions(user).has(permission);
}
