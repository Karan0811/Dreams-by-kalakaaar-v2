import "server-only";
import type { WishlistEntry } from "@dbk/types";
import { apiFetch } from "../client";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function fetchWishlist(accessToken: string): Promise<{ data: WishlistEntry[] }> {
  return apiFetch<{ data: WishlistEntry[] }>("/users/me/wishlist", {
    method: "GET",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
}

export async function addWishlistItem(accessToken: string, productId: string): Promise<WishlistEntry> {
  return apiFetch<WishlistEntry>("/users/me/wishlist", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: { productId },
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function removeWishlistItem(accessToken: string, productId: string): Promise<void> {
  await apiFetch<void>(`/users/me/wishlist/${productId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}
