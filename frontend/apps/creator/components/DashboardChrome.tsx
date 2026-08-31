"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  LineChart,
  MessageCircle,
  Menu,
  Package,
  Settings,
  Star,
  Store,
  Wallet,
} from "lucide-react";
import { useSession, signOut } from "@dbk/auth";
import { Avatar, Button, Sidebar, type SidebarNavItem } from "@dbk/ui";
import { useCreatorPendingActions } from "@dbk/api-client";

/**
 * Creator Navigation (04-information-architecture.md §4.9/§6): a
 * structurally distinct sidebar from the Buyer account nav — no cart/
 * wishlist here, since this is a different operating context (§4.7).
 */
export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { data: session } = useSession();
  const { data: pendingActions } = useCreatorPendingActions();

  const items: SidebarNavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/orders", label: "Orders", icon: Package, badgeCount: pendingActions?.newOrders },
    { href: "/dashboard/products", label: "Products", icon: Boxes },
    { href: "/dashboard/categories", label: "Categories", icon: FolderTree },
    { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
    { href: "/dashboard/messages", label: "Messages", icon: MessageCircle, badgeCount: pendingActions?.unreadMessages },
    { href: "/dashboard/reviews", label: "Reviews", icon: Star },
    { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
    { href: "/dashboard/payouts", label: "Payouts", icon: Wallet },
    { href: "/dashboard/settings", label: "Store Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        items={items}
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        header={
          <div className="mb-2 flex items-center gap-2 px-[var(--space-150)]">
            <Store className="size-5 text-brand-primary" aria-hidden />
            <span className="font-serif text-[16px] text-text-primary">Creator Studio</span>
          </div>
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-16 items-center gap-3 border-b border-border bg-surface px-[var(--space-200)]">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex size-10 items-center justify-center rounded-md text-text-primary lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-[var(--size-icon-lg)]" aria-hidden />
          </button>

          <Link
            href="/"
            className="ml-auto text-[13px] font-medium text-text-link hover:underline"
          >
            Switch to Buyer view
          </Link>

          <div className="flex items-center gap-2">
            <Avatar
              src={session?.user?.image}
              alt=""
              fallback={(session?.user?.name ?? "C").slice(0, 2)}
              size="sm"
            />
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                void signOut();
              }}
            >
              Sign Out
            </Button>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-[var(--space-300)] lg:p-[var(--space-400)]">
          {children}
        </main>
      </div>
    </div>
  );
}
