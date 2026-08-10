import "server-only";
import type { AddCartItemPayload, CartEntry, CartState, UpdateCartItemPayload } from "@dbk/types";
import { apiFetch } from "../client";

/**
 * Cart endpoints (`/users/me/cart`). Replaces the Sprint 01 placeholder
 * (this file previously called a `/cart` + `X-User-Id` contract that
 * doesn't exist on the real backend — `modules/cart` was built in Sprint 02
 * and expects `Authorization: Bearer <token>`, matching every other
 * authenticated endpoint). See `authHeaders` below.
 */
function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function fetchCart(accessToken: string): Promise<CartState> {
  return apiFetch<CartState>("/users/me/cart", {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function addCartItem(accessToken: string, input: AddCartItemPayload): Promise<CartEntry> {
  return apiFetch<CartEntry>("/users/me/cart", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function updateCartItem(
  accessToken: string,
  cartItemId: string,
  input: UpdateCartItemPayload,
): Promise<CartEntry> {
  return apiFetch<CartEntry>(`/users/me/cart/${cartItemId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: input,
  });
}

export async function removeCartItem(accessToken: string, cartItemId: string): Promise<void> {
  await apiFetch<void>(`/users/me/cart/${cartItemId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}
