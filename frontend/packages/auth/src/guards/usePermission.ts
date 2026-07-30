"use client";

import { useMemo } from "react";
import { useSessionUser } from "../client-session-store";
import { hasPermission, type PermissionKey } from "./permissions";

/**
 * `usePermission('creator:suspend')` — gates an individual UI action, per
 * 11-frontend-architecture.md §12.6. This is a convenience layer preventing a
 * user from *attempting* an action they'd be rejected for; it is never the
 * authoritative check.
 */
export function usePermission(permission: PermissionKey): boolean {
  const user = useSessionUser();
  return useMemo(() => hasPermission(user, permission), [user, permission]);
}
