import "server-only";
import type { NotificationRecord } from "@dbk/types";
import { apiFetch } from "../client";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function fetchMyNotifications(
  accessToken: string,
  params: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
): Promise<{ data: NotificationRecord[]; unreadCount: number }> {
  const search = new URLSearchParams();
  if (params.unreadOnly) search.set("unreadOnly", "true");
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString();

  return apiFetch<{ data: NotificationRecord[]; unreadCount: number }>(
    `/users/me/notifications${query ? `?${query}` : ""}`,
    { method: "GET", headers: authHeaders(accessToken), cache: "no-store" },
  );
}

export async function markNotificationRead(
  accessToken: string,
  notificationId: string,
): Promise<NotificationRecord> {
  return apiFetch<NotificationRecord>(`/users/me/notifications/${notificationId}/read`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
}

export async function markAllNotificationsRead(accessToken: string): Promise<void> {
  await apiFetch<void>("/users/me/notifications/read-all", {
    method: "POST",
    headers: authHeaders(accessToken),
  });
}

export async function deleteNotification(accessToken: string, notificationId: string): Promise<void> {
  await apiFetch<void>(`/users/me/notifications/${notificationId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}
