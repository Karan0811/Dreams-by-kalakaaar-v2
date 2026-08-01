"use client";

import * as React from "react";

/**
 * Warns before a tab close/refresh while `isDirty` is true — pass
 * react-hook-form's `formState.isDirty` directly. This only covers the
 * browser-native close/refresh/back-to-another-origin case
 * (`beforeunload`); it does not intercept in-app Next.js `<Link>`
 * navigation, since App Router has no built-in navigation-blocking API
 * yet. Pair with `useConfirmationDialog` at individual "Cancel"/"Back"
 * buttons for in-app navigation, rather than trying to make this hook do
 * both jobs.
 */
export function useUnsavedChangesWarning(isDirty: boolean): void {
  React.useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers require a truthy returnValue to trigger the
      // confirmation prompt; modern ones show a generic message regardless
      // of what it's set to, but setting it is still required for them too.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
