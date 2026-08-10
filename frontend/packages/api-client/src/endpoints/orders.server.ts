import "server-only";
import type { CancelOrderPayload, CreateOrderPayload, OrderDetail, OrderRecord } from "@dbk/types";
import { apiFetch } from "../client";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function fetchMyOrders(
  accessToken: string,
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<{ data: OrderRecord[] }> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString();

  return apiFetch<{ data: OrderRecord[] }>(`/users/me/orders${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function fetchMyOrder(accessToken: string, orderId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/users/me/orders/${orderId}`, {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function createOrder(accessToken: string, input: CreateOrderPayload): Promise<OrderRecord> {
  return apiFetch<OrderRecord>("/users/me/orders", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function cancelOrder(
  accessToken: string,
  orderId: string,
  input: CancelOrderPayload,
): Promise<OrderRecord> {
  return apiFetch<OrderRecord>(`/users/me/orders/${orderId}/cancel`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}
