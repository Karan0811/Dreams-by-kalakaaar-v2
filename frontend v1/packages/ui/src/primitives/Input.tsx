import * as React from "react";
import { cn } from "@dbk/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** True once a validation error is present, applying §14.1's error border
   * and letting FormField pair it with the adjacent message + icon. */
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full min-h-[var(--size-touch-target-min)] md:min-h-10 rounded-md border bg-surface px-3 py-2 text-[14px] text-text-primary",
        "placeholder:text-text-placeholder",
        "transition-colors duration-[var(--duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:bg-[var(--color-disabled-background)] disabled:text-[var(--color-disabled-text)] disabled:border-[var(--color-disabled-border)]",
        hasError ? "border-error focus-visible:ring-error" : "border-border",
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  ),
);
Input.displayName = "Input";
