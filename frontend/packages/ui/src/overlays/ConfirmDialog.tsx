"use client";

import * as React from "react";
import { Button, type ButtonProps } from "../primitives/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./Dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Uses the Button `danger` variant automatically when true — e.g. Delete
   * Product — so every destructive confirmation across the platform looks
   * the same without each feature choosing the variant itself. */
  destructive?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void;
}

/**
 * The reusable "are you sure?" pattern (used by Delete Product, discarding
 * an unpublished draft, etc.). Feature code owns *what* triggers it and
 * *what happens on confirm* — this component only owns the modal shell and
 * button wiring, so every confirmation dialog on the platform behaves and
 * looks identically instead of each feature building its own.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isConfirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmVariant: ButtonProps["variant"] = destructive ? "danger" : "primary";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog" aria-describedby={description ? "confirm-dialog-description" : undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription id="confirm-dialog-description">{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
