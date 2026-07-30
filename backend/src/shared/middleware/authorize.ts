import { loadEffectivePermissions } from '@/shared/authz/repository';
import { AuthorizationError } from '@/shared/errors/base-errors';

/**
 * Authorization middleware step — 10-backend-architecture.md Section 6.1,
 * 08-database-design.md Section 6.8's RBAC evaluation model.
 *
 * Route Handlers declare the permission key(s) their operation requires
 * (e.g. `"products:write"`) and call this after `authenticate`. The JWT's
 * embedded role snapshot is intentionally NOT trusted for the authorization
 * decision itself — roles can be revoked mid-token-lifetime
 * (12-security-architecture.md Section 5.3) — so this always re-reads
 * current grants from Postgres.
 */
export async function authorize(
  userId: string,
  requiredPermission: string,
  options?: { storeId?: string },
): Promise<void> {
  const { permissionKeys } = await loadEffectivePermissions(userId, options?.storeId);

  if (!permissionKeys.has(requiredPermission)) {
    throw new AuthorizationError(`Missing required permission: ${requiredPermission}`);
  }
}

/** Throws unless the caller either owns the resource or holds the fallback permission (e.g. an admin override). */
export async function authorizeOwnerOrPermission(
  userId: string,
  params: { ownerId: string; fallbackPermission: string; storeId?: string },
): Promise<void> {
  if (userId === params.ownerId) return;
  await authorize(userId, params.fallbackPermission, { storeId: params.storeId });
}
