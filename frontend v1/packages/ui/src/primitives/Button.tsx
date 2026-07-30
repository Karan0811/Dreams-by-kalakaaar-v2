"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@dbk/utils";

/**
 * Implements 06-design-system.md §13 exactly: variants map 1:1 to the
 * defined variant table (Primary/Secondary/Tertiary/Ghost/Text/Danger/
 * Success); sizes map 1:1 to §13.2's height tokens. Every size enforces the
 * 44px minimum touch target (§13.4) via padding, even at the `sm` visual
 * height, rather than shrinking the hit area below the accessible minimum.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans text-[14px] font-semibold",
    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]",
    "[&_svg]:size-[var(--size-icon-md)] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-brand-primary text-text-on-brand hover:bg-[var(--color-brand-primary-hover)] active:bg-[var(--color-brand-primary-active)]",
        secondary:
          "border border-border-strong bg-transparent text-text-primary hover:bg-background-subtle",
        tertiary: "bg-transparent text-text-primary hover:bg-background-subtle",
        ghost:
          "border border-transparent bg-transparent text-text-on-brand hover:border-[color-mix(in_oklab,white_60%,transparent)]",
        text: "bg-transparent p-0 h-auto text-text-link underline-offset-4 hover:underline",
        danger: "bg-error text-text-on-brand hover:opacity-90 active:opacity-80",
        success: "bg-success text-text-on-brand hover:opacity-90 active:opacity-80",
      },
      size: {
        sm: "h-8 min-h-[var(--size-touch-target-min)] px-3 text-[13px] md:min-h-8",
        md: "h-10 min-h-[var(--size-touch-target-min)] px-4 md:min-h-10",
        lg: "h-12 px-6 text-[16px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner in place of the label; the button keeps its footprint
   * so nothing shifts layout (§13.1). */
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Radix's Slot requires its `children` to be exactly one valid React
    // element (it calls the equivalent of `Children.only` internally to
    // clone props onto that element). Previously this component always
    // rendered `{spinnerOrNull}{children}` as two sibling children, which
    // silently made `<Button asChild>` render nothing at all — the array
    // of two children is never itself `isValidElement`, so Slot's clone
    // path never ran. When `asChild` is true we must pass `children`
    // through untouched as the single element; the loading treatment only
    // applies to the native `<button>` case, where extra siblings are safe.
    if (asChild) {
      return (
        <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";
