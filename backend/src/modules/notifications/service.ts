import * as notificationsRepository from './repository';
import { NotificationNotFoundError } from './errors';
import type { CreateNotificationInput, ListNotificationsQuery } from './schemas';

export async function listMyNotifications(userId: string, query: ListNotificationsQuery) {
  const [items, unreadCount] = await Promise.all([
    notificationsRepository.listNotifications(userId, query),
    notificationsRepository.countUnread(userId),
  ]);
  return { data: items, unreadCount };
}

/** Called by other modules' Service Layers (Orders on status change, Creators on document review, Reviews on new review) — not exposed as a public Route Handler. */
export async function notify(input: CreateNotificationInput) {
  return notificationsRepository.createNotification(input);
}

export async function markMyNotificationRead(userId: string, notificationId: string) {
  const updated = await notificationsRepository.markAsRead(userId, notificationId);
  if (!updated) throw new NotificationNotFoundError();
  return updated;
}

export async function markAllMyNotificationsRead(userId: string) {
  await notificationsRepository.markAllAsRead(userId);
}

export async function deleteMyNotification(userId: string, notificationId: string) {
  const deleted = await notificationsRepository.deleteNotification(userId, notificationId);
  if (!deleted) throw new NotificationNotFoundError();
  return deleted;
}
