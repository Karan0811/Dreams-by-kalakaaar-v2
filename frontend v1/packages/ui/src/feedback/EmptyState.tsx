import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@dbk/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * The single generic zero-state used across the platform (No Results, My
 * Products empty, Wishlist empty, etc. — §6.1's guided-zero-state
 * philosophy already followed ad hoc in DashboardOverview's "no sales data
 * yet" card). Feature code supplies the copy/icon/action; this component
 * only owns the layout, so every empty state gets the same visual and
 * semantic treatment.
 */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-[var(--radius-300)] border border-border bg-background-subtle px-[var(--space-300)] py-[var(--space-1200)] text-center",
        className,
      )}
    >
      <Icon className="mb-1 size-8 text-text-secondary" aria-hidden />
      <p className="text-[16px] font-medium text-text-primary">{title}</p>
      {description ? <p className="max-w-sm text-[14px] text-text-secondary">{description}</p> : null}
      {action ? <div className="mt-[var(--space-150)]">{action}</div> : null}
    </div>
  );
}
