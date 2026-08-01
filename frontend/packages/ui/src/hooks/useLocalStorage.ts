"use client";

import { useWebStorage } from "./useWebStorage";

/** JSON-serialized localStorage, SSR-safe (falls back to `initialValue` when
 * `window` isn't available). Returns `[value, setValue, remove]`, mirroring
 * `useState`'s tuple shape plus a `remove` to clear the key entirely. */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useWebStorage(typeof window !== "undefined" ? window.localStorage : undefined, key, initialValue);
}
