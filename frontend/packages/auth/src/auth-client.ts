"use client";

import { useEffect, useState } from "react";

type Result = { error: null } | { error: { message: string } };
type ClientUser = { id: string; email: string; name: string; image: null; emailVerified: boolean; roles: string[] };

async function post(path: string, body?: unknown): Promise<Result> {
  try {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (response.ok) return { error: null };
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    return { error: { message: payload?.error?.message ?? "Authentication request failed." } };
  } catch { return { error: { message: "Authentication request failed." } }; }
}

export const signIn = { email: (input: { email: string; password: string }) => post("/api/session/bridge", input) };
export const signUp = { email: (input: { email: string; password: string; name: string }) => post("/api/session/bridge-register", { ...input, displayName: input.name }) };
export const signOut = () => post("/api/session/clear");
export const requestPasswordReset = (input: { email: string; redirectTo?: string }) => post("/api/session/forgot-password", input);
export const resetPassword = (input: { newPassword: string; token: string }) => post("/api/session/reset-password", input);
export const sendVerificationEmail = (input: { email: string }) => post("/api/session/resend-verification", input);

/** Display-only view of the backend's canonical session. API authorization remains server-side. */
export function useSession() {
  const [data, setData] = useState<{ user: ClientUser } | null>(null);
  const [isPending, setPending] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/session/me", { cache: "no-store" })
      .then(async (response) => response.ok ? await response.json() as { user: ClientUser } : null)
      .then((value) => { if (active) setData(value); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setPending(false); });
    return () => { active = false; };
  }, []);
  return { data, isPending };
}
