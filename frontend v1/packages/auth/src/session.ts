import "server-only";
import { headers as nextHeaders } from "next/headers";
import type { SessionUser, UserRole } from "@dbk/types";
import { auth } from "./better-auth.config";

const KNOWN_ROLES: readonly UserRole[] = ["buyer", "creator", "admin", "moderator", "support"];

/**
 * `roles` is persisted by Better Auth as a JSON-encoded string (see the
 * `user.additionalFields` comment in better-auth.config.ts — Better Auth's
 * additional-fields typing isn't threaded through `auth.api.getSession()`'s
 * static return type, so this is a narrow, explicit cast rather than an
 * `any`), so it has to be parsed defensively: malformed or missing data
 * falls back to `["buyer"]` rather than throwing or admitting garbage into
 * `SessionUser.roles`.
 */
function parseRoles(raw: unknown): UserRole[] {
  if (typeof raw !== "string") return ["buyer"];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ["buyer"];
    const roles = parsed.filter((value): value is UserRole =>
      KNOWN_ROLES.includes(value as UserRole),
    );
    return roles.length > 0 ? roles : ["buyer"];
  } catch {
    return ["buyer"];
  }
}

interface BetterAuthUserWithAppFields {
  roles?: unknown;
  hasCreatorProfile?: unknown;
}

/**
 * Resolves the current request's session, server-side, directly from the
 * Better Auth cookie. This is the *authoritative* check
 * (11-frontend-architecture.md §12.2) — every Server Component and Route
 * Handler that touches protected data calls this itself, rather than trusting
 * that `middleware.ts` already gated the request, since middleware alone must
 * never be the sole security boundary.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const result = await auth.api.getSession({ headers: await nextHeaders() });
  if (!result?.user) return null;

  const { user } = result;
  const appFields = user as typeof user & BetterAuthUserWithAppFields;

  return {
    id: user.id as SessionUser["id"],
    email: user.email,
    displayName: user.name ?? user.email,
    avatarUrl: user.image ?? null,
    roles: parseRoles(appFields.roles),
    hasCreatorProfile: appFields.hasCreatorProfile === true,
    emailVerified: user.emailVerified ?? false,
  };
}

/** Throws-if-absent variant for Server Components/Route Handlers that are
 * only ever reached on an already-protected route (defense-in-depth re-check
 * described in §12.2), so a caller never needs a redundant null check. */
export async function requireServerSession(): Promise<SessionUser> {
  const session = await getServerSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
