"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@dbk/utils";

/**
 * Radio group, styled to match Checkbox's border/state treatment
 * (06-design-system.md §14). Radix's RadioGroup is a controlled-value
 * primitive (not a native `<input>`), so it's used with react-hook-form via
 * `Controller`, not `register()` — same pattern as Select and Switch below.
 */
export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn("flex flex-col gap-[var(--space-150)]", className)} {...props} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "peer size-5 shrink-0 rounded-full border border-border-strong bg-surface",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-1",
      "data-[state=checked]:border-brand-primary",
      "disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)]",
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="size-2.5 rounded-full bg-brand-primary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

/** Convenience row pairing a RadioGroupItem with its label text — the label
 * itself extends the click/tap target (§13.4's 44px touch target rule). */
export function RadioGroupItemRow({
  id,
  value,
  label,
  description,
  disabled,
}: {
  id: string;
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-[var(--size-touch-target-min)] items-start gap-3 py-[var(--space-050)]",
        disabled ? "cursor-not-allowed opacity-[var(--opacity-disabled)]" : "cursor-pointer",
      )}
    >
      <RadioGroupItem id={id} value={value} disabled={disabled} className="mt-0.5" />
      <span className="flex flex-col">
        <span className="text-[14px] text-text-primary">{label}</span>
        {description ? <span className="text-[12px] text-text-secondary">{description}</span> : null}
      </span>
    </label>
  );
}
