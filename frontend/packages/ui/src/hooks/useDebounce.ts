"use client";

import * as React from "react";

/** Debounces a value — returns the value only after it's stopped changing
 * for `delayMs`. For debouncing a callback instead of a value, use
 * `@dbk/utils`'s `debounce()`. */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
