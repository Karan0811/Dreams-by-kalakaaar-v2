"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "../primitives/Avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../overlays/DropdownMenu";

export interface UserMenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
}

export interface UserMenuProps {
  name: string;
  email?: string;
  avatarSrc?: string | null;
  items: UserMenuItem[];
}

/**
 * Account dropdown for any app shell — built entirely on the existing
 * `Avatar`/`DropdownMenu` primitives, no new interaction pattern. Creator
 * Studio's current header hard-codes just an Avatar + a "Sign Out" Button
 * side by side (`DashboardChrome.tsx`); this is the reusable version of
 * that idea for shells that want a proper menu (profile, settings, sign
 * out, etc.) instead of one lone button. Adopting it in `DashboardChrome`
 * is a separate, future change — not made here.
 */
export function UserMenu({ name, email, avatarSrc, items }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        aria-label={`Account menu for ${name}`}
      >
        <Avatar src={avatarSrc} alt="" fallback={name.slice(0, 2)} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block text-text-primary">{name}</span>
          {email ? <span className="block font-normal text-text-secondary">{email}</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) =>
          item.href ? (
            <DropdownMenuItem key={item.label} asChild destructive={item.destructive}>
              <Link href={item.href}>{item.label}</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={item.label} onSelect={item.onSelect} destructive={item.destructive}>
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
