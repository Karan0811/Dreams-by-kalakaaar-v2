"use client";

import * as React from "react";
import { logger } from "@dbk/utils";

/** Not exported from the package — `useLocalStorage`/`useSessionStorage`
 * are the public API, this is just their shared, storage-agnostic guts. */
export function useWebStorage<T>(
  storage: Storage | undefined,
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = React.useState<T>(() => {
    if (!storage) return initialValue;
    try {
      const item = storage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      logger.warn("Failed to read from storage", { key, error: String(error) });
      return initialValue;
    }
  });

  const setValue = React.useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          storage?.setItem(key, JSON.stringify(next));
        } catch (error) {
          logger.warn("Failed to write to storage", { key, error: String(error) });
        }
        return next;
      });
    },
    [key, storage],
  );

  const remove = React.useCallback(() => {
    try {
      storage?.removeItem(key);
    } catch (error) {
      logger.warn("Failed to remove from storage", { key, error: String(error) });
    }
    setState(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialValue is a caller-supplied default, not reactive state
  }, [key, storage]);

  return [state, setValue, remove];
}
