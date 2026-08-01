"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@dbk/utils";
import { DialogOverlay } from "./Dialog";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

const sheetVariants = cva(
  "fixed z-[var(--z-modal)] flex flex-col bg-surface-raised shadow-xl focus-visible:outline-none",
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 h-full w-full max-w-[420px] border-l border-border",
        left: "inset-y-0 left-0 h-full w-full max-w-[420px] border-r border-border",
        top: "inset-x-0 top-0 max-h-[85vh] w-full rounded-b-[var(--radius-400)] border-b border-border",
        bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-[var(--radius-400)] border-t border-border",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  hideCloseButton?: boolean;
}

/** Side panel used for the Filter Sidebar on mobile/tablet, and any future
 * secondary panel that isn't a bottom-anchored mobile sheet (see Drawer,
 * which is this component pre-configured with `side="bottom"` plus a grab
 * handle, for that specific mobile pattern). */
export const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(
  ({ className, side, children, hideCloseButton, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), "p-[var(--space-300)]", className)}
        {...props}
      >
        {children}
        {hideCloseButton ? null : (
          <DialogPrimitive.Close
            aria-label="Close panel"
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-background-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          >
            <X className="size-[var(--size-icon-md)]" aria-hidden />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
SheetContent.displayName = "SheetContent";

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-[var(--space-200)] flex flex-col gap-1 pr-8", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("font-serif text-[18px] text-text-primary", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-auto flex flex-col-reverse gap-2 pt-[var(--space-300)] sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
