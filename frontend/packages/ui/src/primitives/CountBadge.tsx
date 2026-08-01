import * as React from "react";
import { cn } from "@dbk/utils";

export interface CountBadgeProps {
  count: number;
  max?: number;
  className?: string;
  /** Screen readers get the exact count regardless of `max` truncation
   * (e.g. "24 unread notifications"), not the truncated "9+" label. */
  label?: string;
}

/**
 * Small numeric pill for overlaying a count on an icon (notifications bell,
 * cart icon, etc.). `Sidebar`'s own nav-item count was hand-rolled inline
 * before this existed — that inline version stays as-is (out of scope to
 * touch this sprint), but any *new* count badge should use this instead of
 * re-hand-rolling the same span again.
 */
export function CountBadge({ count, max = 9, className, label }: CountBadgeProps) {
  if (count <= 0) return null;
  const display = count > max ? `${max}+` : String(count);

  return (
    <span
      aria-label={label ?? `${count} notifications`}
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-semibold text-[var(--color-neutral-000)]",
        className,
      )}
    >
      {display}
    </span>
  );
}
