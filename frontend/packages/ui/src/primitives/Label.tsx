"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@dbk/utils";

/** Persistent, always-visible label per 06-design-system.md §14 and
 * 05-design-principles.md §11.2 — labels are never placeholder-only. */
export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-[13px] font-medium leading-[18px] text-text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-[var(--opacity-disabled)]",
      className,
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;
