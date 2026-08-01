"use client";

import * as React from "react";

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  remove: (id: string) => void;
  clear: () => void;
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

/**
 * A persistent, in-app notification *center* — the bell-icon list of
 * things that happened (a new order, a review), each with a read/unread
 * state. This is a different feature from `Toaster` (`sonner`), which is
 * for transient, self-dismissing confirmations ("Saved", "Copied") that
 * don't need to be looked back at later. Neither replaces the other; a
 * feature might well fire a toast *and* add a persistent notification for
 * the same event.
 *
 * State lives in memory only (`React.useState`) — this provider has no
 * opinion on where notifications come from (a WebSocket, polling, a
 * server push) or how they're persisted across sessions; that's for the
 * feature wiring it up to decide.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);

  const addNotification = React.useCallback<NotificationContextValue["addNotification"]>((notification) => {
    setNotifications((prev) => [
      { ...notification, id: crypto.randomUUID(), createdAt: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  const markAsRead = React.useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const remove = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clear = React.useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = React.useMemo(
    () => ({ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, remove, clear }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, remove, clear],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
