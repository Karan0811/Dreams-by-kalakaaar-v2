"use client";

import * as React from "react";

export interface UseBooleanResult {
  value: boolean;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
  set: (next: boolean) => void;
}

/** A boolean with the three actions every open/enabled/checked flag ends up
 * needing. `useDisclosure` is this same shape with open/close-flavored
 * names for overlay state specifically — use whichever reads better at the
 * call site, they don't duplicate each other's behavior, just naming. */
export function useBoolean(initial = false): UseBooleanResult {
  const [value, setValue] = React.useState(initial);

  return {
    value,
    setTrue: React.useCallback(() => setValue(true), []),
    setFalse: React.useCallback(() => setValue(false), []),
    toggle: React.useCallback(() => setValue((v) => !v), []),
    set: React.useCallback((next: boolean) => setValue(next), []),
  };
}
