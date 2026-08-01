"use client";

import * as React from "react";

/**
 * SSR-safe `window.matchMedia` subscription. Returns `false` on the server
 * and during the first client render (before hydration can safely read
 * `window`), then updates — matches React's hydration-safety rules, at the
 * cost of a possible one-frame layout correction on load. Prefer a
 * Tailwind responsive class over this wherever the difference can be
 * expressed in CSS; reach for this only when a decision must be made in
 * JS (e.g. choosing `Sheet` vs. `Popover` based on viewport).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
