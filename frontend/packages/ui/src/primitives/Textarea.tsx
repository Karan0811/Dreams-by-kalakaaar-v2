"use client";

import * as React from "react";
import { cn } from "@dbk/utils";

export interface TextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onInput"
  > {
  hasError?: boolean;
  onInput?: React.FormEventHandler<HTMLTextAreaElement>;
}

/** Auto-expanding up to a max height, then scrolls, per §14's Textarea row. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, onInput, ...props }, ref) => {
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
      onInput?.(e);
    };

    return (
      <textarea
        ref={ref}
        onInput={handleInput}
        className={cn(
          "flex min-h-[80px] max-h-[320px] w-full overflow-y-auto rounded-md border bg-surface px-3 py-2 text-[14px] text-text-primary",
          "placeholder:text-text-placeholder",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:bg-[var(--color-disabled-background)] disabled:text-[var(--color-disabled-text)]",
          hasError ? "border-error focus-visible:ring-error" : "border-border",
          className,
        )}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
