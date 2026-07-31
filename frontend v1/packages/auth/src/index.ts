export { useClientSessionStore, useSessionUser } from "./client-session-store";

export {
  authClient,
  signIn,
  signUp,
  signOut,
  useSession
} from "./auth-client";

export {
  resolvePermissions,
  hasPermission,
  type PermissionKey,
} from "./guards/permissions";

export { usePermission } from "./guards/usePermission";