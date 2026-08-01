"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@dbk/utils";

/**
 * Styled wrapper around Radix Select (§14's Select row). Replaces the ad hoc
 * native `<select>` markup seen in early feature code (e.g.
 * apps/buyer/components/ProductListClient.tsx's sort dropdown) with a
 * token-driven, fully accessible listbox — that native select is a natural
 * next call-site to migrate onto this component, not something this package
 * touches directly (out of scope: Products module ownership).
 */
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { hasError?: boolean }
>(({ className, hasError, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 min-h-[var(--size-touch-target-min)] w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 py-2 text-[14px] text-text-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-1",
      "disabled:cursor-not-allowed disabled:bg-[var(--color-disabled-background)] disabled:text-[var(--color-disabled-text)]",
      "data-[placeholder]:text-text-placeholder",
      hasError ? "border-error focus-visible:ring-error" : "border-border",
      className,
    )}
    aria-invalid={hasError || undefined}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-[var(--size-icon-md)] shrink-0 text-text-secondary" aria-hidden />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "z-[var(--z-dropdown)] max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-200)] border border-border bg-surface-raised shadow-lg",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex min-h-[var(--size-touch-target-min)] cursor-pointer select-none items-center rounded-[var(--radius-100)] py-2 pl-8 pr-2 text-[14px] text-text-primary outline-none",
      "focus:bg-background-subtle data-[state=checked]:font-medium",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--opacity-disabled)]",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 text-brand-primary" aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
