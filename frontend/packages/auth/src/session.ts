import "server-only";
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

/** Resolves the canonical backend identity from the same bearer token used by every BFF API call. */
export async function getServerSession(): Promise<SessionUser | null> {
  const accessToken = await getBackendAccessToken();
  if (!accessToken) return null;
  try {
    const response = await fetch(`${backendBaseUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { id: string; email: string; emailVerified: boolean; roles: string[] } };
    const user = body;
    console.log("getServerSession user:", user);
    if (!user) return null;
    const roles = toRoles(user.roles);
    return { id: user.id as SessionUser["id"], email: user.email, displayName: user.email, avatarUrl: null,
      roles, hasCreatorProfile: roles.includes("creator"), emailVerified: user.emailVerified };
  } catch { return null; }
}

export async function requireServerSession(): Promise<SessionUser> {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}
