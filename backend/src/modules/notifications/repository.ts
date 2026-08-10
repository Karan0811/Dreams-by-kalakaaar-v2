import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { notifications } from '@/shared/db/schema';
import type { CreateNotificationInput, ListNotificationsQuery } from './schemas';

export async function listNotifications(userId: string, query: ListNotificationsQuery) {
  const conditions = [eq(notifications.userId, userId)];
  if (query.unreadOnly) conditions.push(eq(notifications.isRead, false));

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(query.limit)
    .offset(query.offset);
}

export async function countUnread(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return row?.count ?? 0;
}

export async function findNotificationById(userId: string, notificationId: string) {
  const [row] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createNotification(input: CreateNotificationInput) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
    })
    .returning();
  if (!row) throw new Error('Failed to create notification row.');
  return row;
}

export async function markAsRead(userId: string, notificationId: string) {
  const [row] = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();
  return row ?? null;
}

export async function markAllAsRead(userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function deleteNotification(userId: string, notificationId: string) {
  const [row] = await db
    .delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();
  return row ?? null;
}
