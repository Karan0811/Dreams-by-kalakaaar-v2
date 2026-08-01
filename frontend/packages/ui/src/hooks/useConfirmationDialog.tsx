"use client";

import * as React from "react";
import { ConfirmDialog, type ConfirmDialogProps } from "../overlays/ConfirmDialog";

export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  "open" | "onOpenChange" | "onConfirm" | "isConfirming"
>;

export interface UseConfirmationDialogResult {
  /** Opens the dialog and resolves `true` on confirm, `false` on cancel/
   * dismiss. Call-site usage stays a single `await`, instead of every
   * feature wiring its own open state + confirm/cancel handlers around
   * `ConfirmDialog` by hand. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Render this once, anywhere in the tree that calls `confirm()`. */
  ConfirmationDialog: React.ReactNode;
}

/** Composes the existing `ConfirmDialog` — this hook doesn't reimplement
 * any confirmation UI, it only adds the imperative `confirm()` API on top
 * of it. */
export function useConfirmationDialog(): UseConfirmationDialogResult {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolveRef = React.useRef<(confirmed: boolean) => void>(() => {});

  const confirm = React.useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = React.useCallback((confirmed: boolean) => {
    resolveRef.current(confirmed);
    setOptions(null);
  }, []);

  const ConfirmationDialog = options ? (
    <ConfirmDialog
      {...options}
      open={options !== null}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
      onConfirm={() => settle(true)}
    />
  ) : null;

  return { confirm, ConfirmationDialog };
}
