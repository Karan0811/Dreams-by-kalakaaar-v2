"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@dbk/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/account", label: "Account", icon: User },
] as const;

/** Mobile-only primary navigation pattern (§4.11): Home, Search, Wishlist,
 * Cart, Account. Hidden at md+ where the Navbar's inline links take over. */
export function BottomNav({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] flex h-16 items-center justify-around border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex min-h-[var(--size-touch-target-min)] flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              isActive ? "text-brand-primary" : "text-text-secondary",
            )}
          >
            <Icon className="size-[var(--size-icon-lg)]" aria-hidden />
            {label}
            {href === "/cart" && cartCount > 0 ? (
              <span className="absolute right-[22%] top-1 flex size-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-semibold text-text-on-brand">
                {cartCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
