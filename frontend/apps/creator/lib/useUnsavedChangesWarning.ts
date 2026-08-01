"use client";

import { useCallback, useEffect } from "react";

/**
 * Two halves of "unsaved changes" protection:
 * 1. `beforeunload` — covers tab close, refresh, and typed-URL navigation.
 *    Browsers show their own native prompt; the message string passed to
 *    `preventDefault`/`returnValue` is ignored by modern browsers, but
 *    setting it is still required to trigger the prompt at all.
 * 2. The returned `confirmDiscard()` — call this before any in-app
 *    navigation your own UI triggers (a "Cancel" button, a sidebar link),
 *    since Next.js App Router has no built-in route-change interception to
 *    hook into automatically.
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return useCallback(
    (message = "You have unsaved changes. Leave without saving?") => {
      if (!isDirty) return true;
      return window.confirm(message);
    },
    [isDirty],
  );
}
