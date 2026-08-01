"use client";

import * as React from "react";
import { RotateCw } from "lucide-react";
import { cn } from "@dbk/utils";

export interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  label?: string;
  className?: string;
}

/** A minimal inline "Retry" affordance — for a single failed row, a failed
 * image, or anywhere a full `ErrorState` block would be too heavy.
 * `ErrorState`/`ApiErrorState`/`NetworkErrorState` already have their own
 * built-in retry button for the full-block case; this is specifically for
 * everywhere else. */
export function RetryButton({ onRetry, isRetrying = false, label = "Retry", className }: RetryButtonProps) {
  return (
    <button
      type="button"
      onClick={onRetry}
      disabled={isRetrying}
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px] font-medium text-text-link hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded",
        "disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)] disabled:no-underline",
        className,
      )}
    >
      <RotateCw className={cn("size-3.5", isRetrying && "animate-spin")} aria-hidden />
      {label}
    </button>
  );
}
