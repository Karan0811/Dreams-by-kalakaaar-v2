"use client";

import * as React from "react";
import { Sidebar, type SidebarNavItem } from "../navigation/Sidebar";
import { TopNav } from "./TopNav";
import { useDisclosure } from "../hooks/useDisclosure";
import { useLocalStorage } from "../hooks/useLocalStorage";

export interface AppShellProps {
  sidebarItems: SidebarNavItem[];
  sidebarHeader?: React.ReactNode;
  /** Left slot of the top bar — typically a page title or search box. */
  topNavContent?: React.ReactNode;
  /** Right slot of the top bar — typically `UserMenu`/`NotificationsButton`. */
  topNavActions?: React.ReactNode;
  /** Persists the desktop collapsed rail preference under this key via
   * `useLocalStorage`. Omit to disable the collapse toggle entirely (the
   * rail stays permanently expanded, matching `Sidebar`'s own default). */
  collapseStorageKey?: string;
  children: React.ReactNode;
}

/**
 * The full responsive dashboard shell: `Sidebar` + `TopNav` + a scrollable
 * main content area, wired together with the mobile-drawer and
 * desktop-collapse state both already need. `DashboardChrome` in
 * `apps/creator` currently builds this same shape by hand around the
 * plain `Sidebar` component — this is that composition made reusable for
 * any future dashboard-style app; adopting it in `DashboardChrome` is a
 * separate, future change, not made here.
 */
export function AppShell({
  sidebarItems,
  sidebarHeader,
  topNavContent,
  topNavActions,
  collapseStorageKey,
  children,
}: AppShellProps) {
  const drawer = useDisclosure(false);
  const [collapsed, setCollapsed] = useLocalStorage(collapseStorageKey ?? "__appshell_unused__", false);

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        items={sidebarItems}
        header={sidebarHeader}
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        collapsed={collapseStorageKey ? collapsed : false}
        onCollapsedChange={collapseStorageKey ? setCollapsed : undefined}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onOpenMenu={drawer.open} actions={topNavActions}>
          {topNavContent}
        </TopNav>

        <main id="main-content" className="flex-1 p-[var(--space-300)] lg:p-[var(--space-400)]">
          {children}
        </main>
      </div>
    </div>
  );
}
