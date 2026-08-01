"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@dbk/utils";
import type { AppNotification } from "./NotificationProvider";
import { EmptyState } from "../feedback/EmptyState";
import { Button } from "../primitives/Button";

export interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  emptyMessage?: string;
}

/**
 * Presentational list for `useNotifications`' state — pass it straight
 * through as `NotificationsButton`'s `children`:
 * `<NotificationsButton count={unreadCount}><NotificationCenter ... /></NotificationsButton>`.
 * Kept separate from `NotificationsButton` itself so the trigger has no
 * opinion on how the list looks.
 */
export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  emptyMessage = "You're all caught up",
}: NotificationCenterProps) {
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="flex max-h-96 flex-col">
      <div className="flex items-center justify-between border-b border-border px-[var(--space-200)] py-[var(--space-150)]">
        <span className="text-[14px] font-medium text-text-primary">Notifications</span>
        {hasUnread ? (
          <Button variant="tertiary" size="sm" onClick={onMarkAllAsRead}>
            Mark all read
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title={emptyMessage} className="border-none bg-transparent py-[var(--space-400)]" />
      ) : (
        <ul className="flex-1 overflow-y-auto py-1">
          {notifications.map((notification) => {
            const content = (
              <div
                className={cn(
                  "flex flex-col gap-0.5 px-[var(--space-200)] py-[var(--space-150)] text-left",
                  !notification.read && "bg-brand-primary/5",
                )}
              >
                <div className="flex items-center gap-2">
                  {!notification.read ? (
                    <span className="size-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                  ) : null}
                  <span className="text-[13px] font-medium text-text-primary">{notification.title}</span>
                </div>
                {notification.description ? (
                  <span className="text-[12px] text-text-secondary">{notification.description}</span>
                ) : null}
              </div>
            );

            return (
              <li key={notification.id}>
                {notification.href ? (
                  <Link
                    href={notification.href}
                    onClick={() => onMarkAsRead(notification.id)}
                    className="block hover:bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-border-focus)]"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onMarkAsRead(notification.id)}
                    className="block w-full hover:bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-border-focus)]"
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
