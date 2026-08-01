"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { cn } from "@dbk/utils";

export interface TopNavProps {
  /** Shown only below `lg`, opens the Sidebar's off-canvas drawer — pass
   * `Sidebar`'s own `onClose`'s counterpart (an `onOpen`/`setDrawerOpen(true)`
   * from wherever the drawer's `isOpen` state lives). */
  onOpenMenu?: () => void;
  /** Page title or search bar — left-aligned, next to the menu button. */
  children?: React.ReactNode;
  /** Right-aligned slot — typically `UserMenu` and/or `NotificationsButton`. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The generic dashboard top bar (Creator Studio's hand-rolled `<header>` in
 * `DashboardChrome` is the existing example of this shape — this is that
 * pattern extracted as reusable infrastructure, not a replacement for it;
 * adopting it there is a separate, future change). Distinct from `Navbar`,
 * which is the buyer storefront's marketing/shop navigation — different
 * context, different content, not a duplicate.
 */
export function TopNav({ onOpenMenu, children, actions, className }: TopNavProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] flex h-16 items-center gap-3 border-b border-border bg-surface px-[var(--space-200)]",
        className,
      )}
    >
      {onOpenMenu ? (
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex size-10 items-center justify-center rounded-md text-text-primary lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-[var(--size-icon-lg)]" aria-hidden />
        </button>
      ) : null}

      <div className="min-w-0 flex-1">{children}</div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
