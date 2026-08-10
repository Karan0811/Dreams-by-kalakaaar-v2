"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationRecord } from "@dbk/types";
import { browserFetch } from "../browserFetch";
import { notificationKeys } from "../query-keys";

export function useMyNotifications(params: { unreadOnly?: boolean; limit?: number; offset?: number } = {}) {
  const search = new URLSearchParams();
  if (params.unreadOnly) search.set("unreadOnly", "true");
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString();

  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () =>
      browserFetch<{ data: NotificationRecord[]; unreadCount: number }>(
        `/api/notifications${query ? `?${query}` : ""}`,
      ),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      browserFetch<NotificationRecord>(`/api/notifications/${notificationId}/read`, { method: "POST" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => browserFetch<void>("/api/notifications/read-all", { method: "POST" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      browserFetch<void>(`/api/notifications/${notificationId}`, { method: "DELETE" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
