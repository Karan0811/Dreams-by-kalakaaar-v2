"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@dbk/utils";
import type { LucideIcon } from "lucide-react";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Rendered as a count badge (e.g. new orders) rather than a colored dot
   * alone, per §26 accessibility — counts must be screen-reader announced. */
  badgeCount?: number;
}

export interface SidebarProps {
  items: SidebarNavItem[];
  /** Sidebar visibility is resolved server-side from the session's
   * permission set (11-frontend-architecture.md §12.5) — a restricted item
   * is simply absent from `items`, never rendered disabled. */
  isOpen?: boolean;
  onClose?: () => void;
  header?: React.ReactNode;
}

/**
 * Persistent left sidebar at lg/xl; collapses to an off-canvas drawer at md
 * and below (06-design-system.md §6.7). Used identically by the Creator
 * Dashboard shell (§6.11) — only the `items` passed in differ.
 */
export function Sidebar({ items, isOpen = false, onClose, header }: SidebarProps) {
  const pathname = usePathname();

  const nav = (
    <nav aria-label="Dashboard" className="flex h-full flex-col gap-1 p-[var(--space-200)]">
      {header}
      {items.map(({ href, label, icon: Icon, badgeCount }) => {
        const isActive = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-[var(--size-touch-target-min)] items-center gap-3 rounded-md px-[var(--space-150)] text-[14px] font-medium",
              isActive
                ? "bg-brand-primary/10 text-brand-primary"
                : "text-text-secondary hover:bg-background-subtle hover:text-text-primary",
            )}
          >
            <Icon className="size-[var(--size-icon-md)]" aria-hidden />
            <span className="flex-1">{label}</span>
            {badgeCount ? (
              <span
                aria-label={`${badgeCount} pending`}
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 text-[11px] font-semibold text-text-on-brand"
              >
                {badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Persistent rail, lg+ */}
      <aside className="hidden lg:block w-[260px] shrink-0 border-r border-border bg-surface">
        {nav}
      </aside>

      {/* Off-canvas drawer, below lg */}
      {isOpen ? (
        <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="absolute inset-0 bg-[var(--color-overlay-scrim)]"
          />
          <aside className="relative z-10 h-full w-[280px] max-w-[80vw] bg-surface shadow-xl">
            {nav}
          </aside>
        </div>
      ) : null}
    </>
  );
}
