import "server-only";
import type { CreateUserAddressPayload, UpdateUserAddressPayload, UserAddress } from "@dbk/types";
import { apiFetch } from "../client";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function fetchMyAddresses(accessToken: string): Promise<{ data: UserAddress[] }> {
  return apiFetch<{ data: UserAddress[] }>("/users/me/addresses", {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function createMyAddress(
  accessToken: string,
  input: CreateUserAddressPayload,
): Promise<UserAddress> {
  return apiFetch<UserAddress>("/users/me/addresses", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function updateMyAddress(
  accessToken: string,
  addressId: string,
  input: UpdateUserAddressPayload,
): Promise<UserAddress> {
  return apiFetch<UserAddress>(`/users/me/addresses/${addressId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: input,
  });
}

export async function deleteMyAddress(accessToken: string, addressId: string): Promise<void> {
  await apiFetch<void>(`/users/me/addresses/${addressId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}
