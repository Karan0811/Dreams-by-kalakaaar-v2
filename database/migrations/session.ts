import "server-only";
import { cache } from "react";
import type { SessionUser, UserRole } from "@dbk/types";
import { getBackendAccessToken } from "./access-token";

function backendBaseUrl(): string {
  const value = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) throw new Error("API_BASE_URL is not configured.");
  return value.replace(/\/$/, "");
}

function toRoles(roleNames: string[]): UserRole[] {
  const names = new Set(roleNames.map((name) => name.toLowerCase()));
  const roles: UserRole[] = ["buyer"];
  if ([...names].some((name) => name.includes("creator"))) roles.push("creator");
  if (names.has("admin") || names.has("super admin")) roles.push("admin");
  if (names.has("moderator")) roles.push("moderator");
  if (names.has("support")) roles.push("support");
  return roles;
}

/**
 * Resolves the canonical backend identity from the same bearer token used
 * by every BFF API call.
 *
 * PERF FIX: wrapped in React's `cache()` so multiple Server Components
 * within the same render pass (e.g. a route's `layout.tsx` *and*
 * `page.tsx` both calling `getServerSession()` — as the creator app's
 * `(dashboard)/layout.tsx` + `dashboard/page.tsx` already do) share a
 * single `/auth/me` network round trip instead of issuing one each.
 * `cache()` de-dupes per request/render, never across requests, so this
 * does not risk serving a stale session to a later request.
 */
async function fetchServerSession(): Promise<SessionUser | null> {
  const accessToken = await getBackendAccessToken();
  if (!accessToken) return null;
  try {
    const response = await fetch(`${backendBaseUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { id: string; email: string; emailVerified: boolean; roles: string[] };
    if (!user) return null;
    const roles = toRoles(user.roles);
    return { id: user.id as SessionUser["id"], email: user.email, displayName: user.email, avatarUrl: null,
      roles, hasCreatorProfile: roles.includes("creator"), emailVerified: user.emailVerified };
  } catch { return null; }
}

export const getServerSession = cache(fetchServerSession);

export async function requireServerSession(): Promise<SessionUser> {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}
