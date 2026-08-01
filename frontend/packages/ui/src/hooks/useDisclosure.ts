"use client";

import * as React from "react";

export interface UseDisclosureResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Drop-in for a controlled component's `onOpenChange` prop
   * (Dialog/Sheet/Drawer/Popover all use this exact signature). */
  onOpenChange: (open: boolean) => void;
}

/** Open/close state for any overlay — `const { isOpen, open, close,
 * onOpenChange } = useDisclosure(); <Dialog open={isOpen} onOpenChange={onOpenChange}>`. */
export function useDisclosure(initial = false): UseDisclosureResult {
  const [isOpen, setIsOpen] = React.useState(initial);

  return {
    isOpen,
    open: React.useCallback(() => setIsOpen(true), []),
    close: React.useCallback(() => setIsOpen(false), []),
    toggle: React.useCallback(() => setIsOpen((v) => !v), []),
    onOpenChange: React.useCallback((open: boolean) => setIsOpen(open), []),
  };
}
