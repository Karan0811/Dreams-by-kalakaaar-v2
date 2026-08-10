"use client";

import { Bell, Check, Trash2 } from "lucide-react";
import {
  useMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@dbk/api-client";
import { cn } from "@dbk/utils";
import { Button, Card, EmptyState, ErrorState, Skeleton, toast } from "@dbk/ui";

export function NotificationsClient() {
  const { data, isLoading, isError, refetch } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="We couldn't load your notifications." onRetry={() => refetch()} />;
  }

  const notifications = data?.data ?? [];

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-[22px] text-text-primary">Notifications</h1>
        {data && data.unreadCount > 0 ? (
          <Button
            variant="tertiary"
            size="sm"
            isLoading={markAllRead.isPending}
            onClick={() =>
              markAllRead.mutate(undefined, {
                onError: () => toast.error("Couldn't mark notifications as read."),
              })
            }
          >
            Mark all as read
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="We'll let you know when something needs your attention." />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Card className={cn("flex items-start justify-between gap-3", !notification.isRead && "border-brand-primary bg-brand-primary/5")}>
                <div>
                  <p className="text-[14px] font-medium text-text-primary">{notification.title}</p>
                  <p className="mt-0.5 text-[13px] text-text-secondary">{notification.body}</p>
                  <p className="mt-1 text-[12px] text-text-secondary">
                    {new Date(notification.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!notification.isRead ? (
                    <Button
                      variant="tertiary"
                      size="sm"
                      aria-label="Mark as read"
                      onClick={() => markRead.mutate(notification.id, { onError: () => toast.error("Couldn't update this notification.") })}
                    >
                      <Check className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                  <Button
                    variant="tertiary"
                    size="sm"
                    aria-label="Delete notification"
                    onClick={() =>
                      deleteNotification.mutate(notification.id, {
                        onError: () => toast.error("Couldn't delete this notification."),
                      })
                    }
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
