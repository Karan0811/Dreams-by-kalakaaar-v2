"use client";

import * as React from "react";

/** Returns the value from the previous render (`undefined` on the first). */
export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
