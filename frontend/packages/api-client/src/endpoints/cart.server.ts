import "server-only";
import type { Cart } from "@dbk/types";
import type { AddCartItemInput } from "@dbk/utils";
import { apiFetch } from "../client";

/** Server-only cart endpoint functions, called from Route Handlers after
 * the caller's session has already been validated there. */
export async function fetchCart(sessionUserId: string): Promise<{ data: Cart }> {
  return apiFetch<{ data: Cart }>("/cart", {
    method: "GET",
    headers: { "X-User-Id": sessionUserId },
    cache: "no-store",
  });
}

export async function addCartItem(
  sessionUserId: string,
  input: AddCartItemInput,
): Promise<{ data: Cart }> {
  return apiFetch<{ data: Cart }>("/cart/items", {
    method: "POST",
    headers: { "X-User-Id": sessionUserId },
    body: input,
    idempotencyKey: crypto.randomUUID(),
  });
}
