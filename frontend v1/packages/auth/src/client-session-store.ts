"use client";

import { create } from "zustand";
import type { SessionUser } from "@dbk/types";

/**
 * A lightweight, non-authoritative "is authenticated + role + display name"
 * snapshot, populated once from the server-rendered shell
 * (11-frontend-architecture.md §12.4). Used only to drive UI decisions
 * (e.g., which account-menu items to render) — never treated as sufficient
 * for gating an actual data request, which always re-validates server-side
 * regardless of what this snapshot claims.
 */
interface ClientSessionState {
  user: SessionUser | null;
  hydrate: (user: SessionUser | null) => void;
  clear: () => void;
}

export const useClientSessionStore = create<ClientSessionState>((set) => ({
  user: null,
  hydrate: (user) => set({ user }),
  clear: () => set({ user: null }),
}));

export function useSessionUser(): SessionUser | null {
  return useClientSessionStore((s) => s.user);
}
