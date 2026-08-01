"use client";

import * as React from "react";
import { cn } from "@dbk/utils";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "./Sheet";

export { Sheet as Drawer, SheetTrigger as DrawerTrigger, SheetClose as DrawerClose, SheetFooter as DrawerFooter };

/**
 * The mobile bottom-sheet pattern (Sort/Filter panels on small screens,
 * §8.11 mobile variant), implemented as Sheet pinned to `side="bottom"` plus
 * a grab handle — not a separate primitive. Radix Dialog already gives us
 * swipe-to-dismiss-equivalent behavior via Escape/overlay-tap; a real
 * drag-to-dismiss gesture (like `vaul`) is the natural upgrade if user
 * testing shows the tap target isn't discoverable enough, but that's an
 * additional dependency this package doesn't take on speculatively.
 */
export function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetContent>) {
  return (
    <SheetContent side="bottom" className={cn("gap-[var(--space-200)]", className)} {...props}>
      <div className="mx-auto -mt-1 mb-1 h-1 w-10 shrink-0 rounded-full bg-border-strong" aria-hidden />
      {children}
    </SheetContent>
  );
}

export function DrawerHeader(props: React.ComponentPropsWithoutRef<typeof SheetHeader>) {
  return <SheetHeader {...props} />;
}

export function DrawerTitle(props: React.ComponentPropsWithoutRef<typeof SheetTitle>) {
  return <SheetTitle {...props} />;
}
