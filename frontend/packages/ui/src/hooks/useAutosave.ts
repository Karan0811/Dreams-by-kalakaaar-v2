"use client";

import * as React from "react";
import { useDebounce } from "./useDebounce";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutosaveOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  delayMs?: number;
  /** Skip autosaving until this is true (e.g. a form's own `isDirty`) —
   * without it, this would fire once on mount with the initial value. */
  enabled?: boolean;
}

/**
 * Debounces `value` and calls `onSave` after it's settled for `delayMs`.
 * Generic over any serializable draft shape — this hook has no knowledge
 * of what it's saving or where to (that's `onSave`, supplied by the
 * feature). Guards against a slow save resolving after a newer one has
 * already started by tracking each call's own generation number.
 */
export function useAutosave<T>({
  value,
  onSave,
  delayMs = 1500,
  enabled = true,
}: UseAutosaveOptions<T>): AutosaveStatus {
  const [status, setStatus] = React.useState<AutosaveStatus>("idle");
  const debouncedValue = useDebounce(value, delayMs);
  const generationRef = React.useRef(0);
  const isFirstRun = React.useRef(true);

  React.useEffect(() => {
    if (!enabled) return;
    // Skip the save that would otherwise fire immediately on mount with
    // the initial value — autosave should only react to actual changes.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const generation = ++generationRef.current;
    setStatus("saving");

    onSave(debouncedValue)
      .then(() => {
        if (generationRef.current === generation) setStatus("saved");
      })
      .catch(() => {
        if (generationRef.current === generation) setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSave is expected to be stable per call site (wrap in useCallback); including it would re-run on every render for an inline function
  }, [debouncedValue, enabled]);

  return status;
}
