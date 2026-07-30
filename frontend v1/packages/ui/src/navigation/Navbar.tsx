"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@dbk/utils";

export interface NavAccountSummary {
  isAuthenticated: boolean;
  displayName?: string;
}

export interface NavbarProps {
  cartCount?: number;
  wishlistCount?: number;
  account?: NavAccountSummary;
  onMenuToggle?: () => void;
}

/**
 * Global Navigation (04-information-architecture.md §4.1): logo, search
 * entry, Categories/Collections, wishlist, cart, account menu. Persistent
 * and fixed-position at every breakpoint per 06-design-system.md §6.8.
 * A thin Client Component shell — the actual cart/wishlist counts and
 * account identity are passed in as props by the consuming layout, which
 * reads them from TanStack Query / the session snapshot.
 */
export function Navbar({ cartCount = 0, wishlistCount = 0, account, onMenuToggle }: NavbarProps) {
  const pathname = usePathname();

  const primaryLinks = [
    { href: "/products", label: "All Products" },
    { href: "/collections", label: "Collections" },
    { href: "/categories", label: "Categories" },
    { href: "/creators", label: "Creators" },
  ];

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] w-full border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-(--container-content-xl) items-center gap-4 px-[var(--space-200)] lg:px-[var(--space-600)]">
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex size-10 items-center justify-center rounded-md text-text-primary md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-[var(--size-icon-lg)]" aria-hidden />
        </button>

        <Link href="/" className="font-serif text-[20px] font-medium text-text-primary shrink-0">
          Dreams by Kalakaaar
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-6 ml-4">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[14px] font-medium text-text-secondary hover:text-text-primary",
                pathname?.startsWith(link.href) && "text-text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Search"
            className="flex size-10 items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-background-subtle"
          >
            <Search className="size-[var(--size-icon-lg)]" aria-hidden />
          </Link>
          <Link
            href="/account/wishlist"
            aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`}
            className="relative hidden sm:flex size-10 items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-background-subtle"
          >
            <Heart className="size-[var(--size-icon-lg)]" aria-hidden />
            {wishlistCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-semibold text-text-on-brand">
                {wishlistCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
            className="relative flex size-10 items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-background-subtle"
          >
            <ShoppingBag className="size-[var(--size-icon-lg)]" aria-hidden />
            {cartCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-semibold text-text-on-brand">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <Link
            href={account?.isAuthenticated ? "/account" : "/login"}
            aria-label={account?.isAuthenticated ? "Account" : "Sign in"}
            className="flex size-10 items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-background-subtle"
          >
            <User className="size-[var(--size-icon-lg)]" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
