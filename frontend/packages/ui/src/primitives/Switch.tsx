"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@dbk/utils";

/** Controlled on/off toggle (e.g. Draft/Publish). Like RadioGroup/Select,
 * this is a value/onCheckedChange primitive — pair it with react-hook-form's
 * `Controller`, not `register()`. */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent",
      "bg-[var(--color-neutral-400)] transition-colors duration-[var(--duration-fast)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
      "data-[state=checked]:bg-brand-primary",
      "disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)]",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "block size-5 translate-x-0.5 rounded-full bg-[var(--color-neutral-000)] shadow-sm transition-transform duration-[var(--duration-fast)]",
        "data-[state=checked]:translate-x-[22px]",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;
