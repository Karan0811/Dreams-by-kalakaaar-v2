import * as React from "react";
import { cn } from "@dbk/utils";

export interface EmptyLayoutProps {
  /** Usually a logo `<Link>` back to the marketing home — kept generic
   * (both apps use different wordmarks/hrefs) rather than baked in. */
  header?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
  className?: string;
}

/**
 * A focused, chrome-free centered layout: a small header slot above a
 * bordered card. Both `apps/buyer/app/(auth)/layout.tsx` and
 * `apps/creator/app/(auth)/layout.tsx` currently hand-roll this exact
 * structure independently (same flex/padding/card classes, different
 * wordmark). This is that shape as reusable infrastructure — migrating
 * either app's existing layout.tsx onto it is a separate, future change,
 * not made here (out of scope: don't modify app-level auth layouts this
 * sprint).
 */
export function EmptyLayout({ header, children, maxWidth = 400, className }: EmptyLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background-subtle px-[var(--space-200)] py-[var(--space-800)]">
      {header}
      <div
        className={cn("w-full rounded-[var(--radius-400)] border border-border bg-surface p-[var(--space-400)] shadow-md", className)}
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
