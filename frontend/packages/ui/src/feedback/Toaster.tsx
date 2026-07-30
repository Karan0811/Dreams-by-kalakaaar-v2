"use client";

import { Toaster as SonnerToaster } from "sonner";

/** Mounted once in each app's root layout. Wraps sonner (per the finalized
 * stack) so toast styling stays token-driven rather than sonner's defaults. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface-raised !border !border-border !text-text-primary !rounded-[var(--radius-300)] !shadow-lg",
          description: "!text-text-secondary",
        },
      }}
    />
  );
}

export { toast } from "sonner";
