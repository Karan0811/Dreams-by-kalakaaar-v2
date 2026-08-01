"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft } from "lucide-react";
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
  /** Collapses the persistent lg+ rail to icon-only. Omit both this and
   * `onCollapsedChange` for the original always-expanded behavior — every
   * existing call site keeps working unchanged. New consumers manage the
   * boolean themselves (e.g. via `useLocalStorage`, so the preference
   * survives a reload) and pass it down. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

function SidebarNavList({
  items,
  header,
  collapsed,
  pathname,
}: {
  items: SidebarNavItem[];
  header?: React.ReactNode;
  collapsed: boolean;
  pathname: string | null;
}) {
  return (
    <nav aria-label="Dashboard" className="flex h-full flex-col gap-1 p-[var(--space-200)]">
      {header}
      {items.map(({ href, label, icon: Icon, badgeCount }) => {
        const isActive = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "flex min-h-[var(--size-touch-target-min)] items-center gap-3 rounded-md px-[var(--space-150)] text-[14px] font-medium",
              collapsed && "justify-center px-0",
              isActive
                ? "bg-brand-primary/10 text-brand-primary"
                : "text-text-secondary hover:bg-background-subtle hover:text-text-primary",
            )}
          >
            <Icon className="size-[var(--size-icon-md)] shrink-0" aria-hidden />
            {collapsed ? (
              <span className="sr-only">{badgeCount ? `${label}, ${badgeCount} pending` : label}</span>
            ) : (
              <>
                <span className="flex-1">{label}</span>
                {badgeCount ? (
                  <span
                    aria-label={`${badgeCount} pending`}
                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 text-[11px] font-semibold text-text-on-brand"
                  >
                    {badgeCount}
                  </span>
                ) : null}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Persistent left sidebar at lg/xl; collapses to an off-canvas drawer at md
 * and below (06-design-system.md §6.7). Used identically by the Creator
 * Dashboard shell (§6.11) — only the `items` passed in differ.
 */
export function Sidebar({ items, isOpen = false, onClose, header, collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Persistent rail, lg+ */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col shrink-0 border-r border-border bg-surface transition-[width] duration-[var(--duration-standard)]",
          collapsed ? "lg:w-[72px]" : "lg:w-[260px]",
        )}
      >
        <div className="flex-1 overflow-y-auto">
          <SidebarNavList items={items} header={header} collapsed={collapsed} pathname={pathname} />
        </div>
        {onCollapsedChange ? (
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex min-h-[var(--size-touch-target-min)] items-center justify-center border-t border-border text-text-secondary hover:bg-background-subtle hover:text-text-primary"
          >
            <ChevronsLeft
              className={cn("size-[var(--size-icon-md)] transition-transform", collapsed && "rotate-180")}
              aria-hidden
            />
          </button>
        ) : null}
      </aside>

      {/* Off-canvas drawer, below lg — always shows full labels regardless of `collapsed`, which only affects the persistent lg+ rail */}
      {isOpen ? (
        <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="absolute inset-0 bg-[var(--color-overlay-scrim)]"
          />
          <aside className="relative z-10 h-full w-[280px] max-w-[80vw] bg-surface shadow-xl">
            <SidebarNavList items={items} header={header} collapsed={false} pathname={pathname} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
