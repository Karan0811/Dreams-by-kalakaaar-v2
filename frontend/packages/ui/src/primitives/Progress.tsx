"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@dbk/utils";

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** 0-100. Used for determinate progress (e.g. image upload %) — for
   * indeterminate loading, reach for Spinner instead (feedback/Spinner). */
  value?: number;
}

export const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-background-subtle", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full flex-1 rounded-full bg-brand-primary transition-transform duration-[var(--duration-standard)] ease-[var(--ease-standard)]"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  ),
);
Progress.displayName = ProgressPrimitive.Root.displayName;
