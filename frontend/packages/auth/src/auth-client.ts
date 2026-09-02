"use client";

import { useEffect, useState } from "react";

type Result = { error: null } | { error: { message: string } };
type ClientUser = { id: string; email: string; name: string; image: null; emailVerified: boolean; roles: string[] };
type SessionResponse = { user: ClientUser } | null;

let sessionRequest: Promise<SessionResponse> | null = null;
let sessionCacheExpiresAt = 0;
const SESSION_CHANGED_EVENT = "dbk:session-changed";

async function post(path: string, body?: unknown): Promise<Result> {
  try {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (response.ok) return { error: null };
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return { error: { message: payload?.error?.message ?? "Authentication request failed." } };
  } catch { return { error: { message: "Authentication request failed." } }; }
}

function invalidateSessionCache() {
  sessionRequest = null;
  sessionCacheExpiresAt = 0;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
  }
}

// Auth actions are intentionally wrapped so a cached anonymous response is
// never kept after a successful sign-in/sign-up/sign-out.
export const signIn = {
  email: async (input: { email: string; password: string }) => {
    const result = await post("/api/session/bridge", input);
    if (!result.error) invalidateSessionCache();
    return result;
  },
};

export const signUp = {
  email: async (input: { email: string; password: string; name: string }) => {
    const result = await post("/api/session/bridge-register", { ...input, displayName: input.name });
    if (!result.error) invalidateSessionCache();
    return result;
  },
};

export const signOut = async () => {
  const result = await post("/api/session/clear");
  if (!result.error) invalidateSessionCache();
  return result;
};
export const requestPasswordReset = (input: { email: string; redirectTo?: string }) => post("/api/session/forgot-password", input);
export const resetPassword = (input: { newPassword: string; token: string }) => post("/api/session/reset-password", input);
export const sendVerificationEmail = (input: { email: string }) => post("/api/session/resend-verification", input);

/** Display-only view of the backend's canonical session. API authorization remains server-side. */
export function useSession() {
  const [data, setData] = useState<{ user: ClientUser } | null>(null);
  const [isPending, setPending] = useState(true);
  useEffect(() => {
    let active = true;
    const load = () => {
      setPending(true);
      if (!sessionRequest || Date.now() >= sessionCacheExpiresAt) {
        sessionRequest = fetch("/api/session/me", { cache: "no-store" })
          .then(async (response) => response.ok ? await response.json() as { user: ClientUser } : null)
          .catch(() => null)
          .then((value) => {
            sessionCacheExpiresAt = Date.now() + 30_000;
            return value;
          });
      }
      sessionRequest
      .then((value) => { if (active) setData(value); })
      .finally(() => { if (active) setPending(false); });
    };
    load();
    window.addEventListener(SESSION_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(SESSION_CHANGED_EVENT, load);
    };
  }, []);
  return { data, isPending };
}
