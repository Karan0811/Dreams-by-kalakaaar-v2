"use client";

import { useWebStorage } from "./useWebStorage";

/** Same contract as `useLocalStorage`, backed by `sessionStorage` instead —
 * use for state that shouldn't outlive the tab (a multi-step form's draft,
 * for instance). */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useWebStorage(typeof window !== "undefined" ? window.sessionStorage : undefined, key, initialValue);
}
