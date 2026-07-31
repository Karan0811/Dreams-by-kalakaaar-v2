"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@dbk/utils";

/** Mount once near the app root (alongside Toaster) so every Tooltip on the
 * page shares one delay group instead of each re-opening cold. */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Tooltips are supplementary, never load-bearing (§26 accessibility):
 * anything a tooltip explains must also be understandable without it, since
 * Radix's hover/focus trigger has no reliable touch-device equivalent. Don't
 * put a control's only label or its only error text in a Tooltip.
 */
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[var(--z-tooltip)] max-w-64 rounded-[var(--radius-100)] bg-[var(--color-neutral-900)] px-2 py-1 text-[12px] text-[var(--color-neutral-000)] shadow-md",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
