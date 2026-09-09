"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Heart, MapPin, Package, Store, User } from "lucide-react";
import { cn } from "@dbk/utils";

// BUG FIX (Phase 3): "Messages" and "Settings" previously linked to
// /account/messages and /account/settings, neither of which exists as a
// page — both 404'd on every account page. Messages has no backend module
// at all (no messages/conversations module in backend/src/modules);
// Settings has a working GET/PATCH /v1/users/me/profile endpoint but zero
// frontend wiring anywhere (no hook, no page). Building either out is a new
// feature, not a navigation fix, and neither is in the MVP buyer flow
// (Home → Products → Product Detail → Cart → Checkout → Address → Order
// Confirmation → Orders → Order Detail) — so the entries are removed here
// rather than left as dead links. Settings is a good candidate for a future
// phase since the backend already supports it.
const accountLinks = [
  { href: "/account/dashboard", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
] as const;

const navItemClassName = (isActive: boolean) =>
  cn(
    "flex shrink-0 min-h-[var(--size-touch-target-min)] items-center gap-2 whitespace-nowrap rounded-md px-[var(--space-150)] text-[14px] font-medium",
    isActive ? "bg-brand-primary/10 text-brand-primary" : "text-text-secondary hover:bg-background-subtle hover:text-text-primary",
  );

export function AccountNav() {
  const pathname = usePathname();
  // BUG FIX: "Become a Creator" lives at apps/creator/app/become-a-creator/
  // page.tsx — a completely separate Next.js app/origin from this one, not
  // a route inside apps/buyer. A same-app relative <Link href="/become-a-
  // creator"> 404s here; it needs to be an absolute cross-app URL, matching
  // the pattern apps/creator already uses for its own buyer-app links
  // (NEXT_PUBLIC_BUYER_APP_URL).
  const creatorAppUrl = process.env.NEXT_PUBLIC_CREATOR_APP_URL ?? "http://localhost:3001";

  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:w-[220px] lg:shrink-0 lg:flex-col lg:overflow-visible">
      {accountLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname?.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={isActive ? "page" : undefined} className={navItemClassName(Boolean(isActive))}>
            <Icon className="size-[var(--size-icon-md)]" aria-hidden />
            {label}
          </Link>
        );
      })}
      <a
        href={`${creatorAppUrl}/become-a-creator`}
        className={navItemClassName(false)}
      >
        <Store className="size-[var(--size-icon-md)]" aria-hidden />
        Become a Creator
      </a>
    </nav>
  );
}
