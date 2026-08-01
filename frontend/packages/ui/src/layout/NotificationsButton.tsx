"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { CountBadge } from "../primitives/CountBadge";
import { Popover, PopoverTrigger, PopoverContent } from "../overlays/Popover";

export interface NotificationsButtonProps {
  count?: number;
  /** Rendered inside the popover — typically `NotificationCenter`. Kept as
   * `children` rather than this component owning the list itself, so it
   * has no opinion on what "a notification" looks like. */
  children: React.ReactNode;
}

export function NotificationsButton({ count = 0, children }: NotificationsButtonProps) {
  return (
    <Popover>
      <PopoverTrigger
        className="relative flex size-10 items-center justify-center rounded-md text-text-secondary hover:bg-background-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      >
        <Bell className="size-[var(--size-icon-md)]" aria-hidden />
        {count > 0 ? (
          <CountBadge count={count} className="absolute right-1 top-1 h-4 min-w-4 px-0.5 text-[10px]" />
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {children}
      </PopoverContent>
    </Popover>
  );
}
