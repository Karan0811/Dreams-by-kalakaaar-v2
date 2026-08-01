"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@dbk/utils";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Distinguishes Chip from Badge (§3.6): a Chip is an interactive,
   * user-removable selection — e.g. an active filter pill — while Badge is
   * a static, non-interactive status label. Don't reach for Badge when the
   * element needs a remove affordance, and don't make Chip non-dismissible
   * (use Badge instead) to keep the two from drifting into duplicates. */
  onRemove?: () => void;
  removeLabel?: string;
}

export function Chip({ className, children, onRemove, removeLabel, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface py-1 pl-3 text-[13px] text-text-primary",
        onRemove ? "pr-1" : "pr-3",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remove ${typeof children === "string" ? children : "item"}`}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-background-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
