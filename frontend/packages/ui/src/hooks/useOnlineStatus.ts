"use client";

import * as React from "react";

/** Tracks `navigator.onLine`, updated via the `online`/`offline` window
 * events. Defaults to `true` on the server and during the first client
 * render (consistent with SSR having no way to know network state). */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
