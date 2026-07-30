"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Heart, MapPin, MessageCircle, Package, Settings, Store, User } from "lucide-react";
import { cn } from "@dbk/utils";

const links = [
  { href: "/account/dashboard", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/messages", label: "Messages", icon: MessageCircle },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings", label: "Settings", icon: Settings },
  { href: "/become-a-creator", label: "Become a Creator", icon: Store },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:w-[220px] lg:shrink-0 lg:flex-col lg:overflow-visible">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 min-h-[var(--size-touch-target-min)] items-center gap-2 whitespace-nowrap rounded-md px-[var(--space-150)] text-[14px] font-medium",
              isActive ? "bg-brand-primary/10 text-brand-primary" : "text-text-secondary hover:bg-background-subtle hover:text-text-primary",
            )}
          >
            <Icon className="size-[var(--size-icon-md)]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
