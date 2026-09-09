"use client";

import Link from "next/link";
import { LogIn, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { ApiError, useCart, useRemoveCartItem, useUpdateCartItem } from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import { Button, EmptyState, Skeleton, toast } from "@dbk/ui";
import type { CartEntry } from "@dbk/types";

/**
 * Real Cart shape (`CartState`/`CartEntry`, Sprint 02) — no product images
 * or creator name are joined in by the backend today (`modules/cart`'s
 * `listCartItems` only joins variant + product title/slug/status), so this
 * intentionally doesn't render either, rather than fabricating placeholder
 * artwork. Reorders/updates every mutation reads live `quantityAvailable`
 * per line, so the stock-limit UI never lags the true inventory.
 */
export function CartView() {
  const { data: cart, isLoading, error } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // `/cart` itself isn't route-protected (only `/account/*` is, per the
  // existing middleware) so a signed-out visitor can land here directly —
  // `useCart` then fails with a 401, not a genuinely empty cart. Treating
  // those the same told a signed-out buyer "your cart is empty" instead of
  // "sign in first", which is actively misleading for the required
  // Login → Product → Add to Cart → Cart flow.
  if (error instanceof ApiError && error.status === 401) {
    return (
      <EmptyState
        icon={LogIn}
        title="Sign in to view your cart"
        description="Your cart is saved to your account once you're signed in."
        action={
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        }
      />
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Browse the catalog to find something you'll love."
        action={
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        }
      />
    );
  }

  function handleQuantityChange(item: CartEntry, nextQuantity: number) {
    if (nextQuantity < 1) return;
    if (item.quantityAvailable !== null && nextQuantity > item.quantityAvailable) {
      toast.error(`Only ${item.quantityAvailable} available.`);
      return;
    }
    updateItem.mutate(
      { cartItemId: item.id, quantity: nextQuantity },
      { onError: () => toast.error("Couldn't update quantity. Please try again.") },
    );
  }

  function handleRemove(item: CartEntry) {
    removeItem.mutate(item.id, {
      onSuccess: () => toast("Removed from cart"),
      onError: () => toast.error("Couldn't remove this item. Please try again."),
    });
  }

  return (
    <div className="grid gap-[var(--space-400)] lg:grid-cols-[1fr_320px]">
      <ul className="flex flex-col gap-[var(--space-200)]">
        {cart.items.map((item) => {
          const atStockLimit = item.quantityAvailable !== null && item.quantity >= item.quantityAvailable;
          return (
            <li
              key={item.id}
              className="flex gap-3 rounded-[var(--radius-300)] border border-border bg-surface p-[var(--space-200)] shadow-[var(--shadow-sm)] transition-shadow duration-[var(--duration-standard)] hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="text-[14px] font-medium text-text-primary transition-colors hover:text-text-link"
                >
                  {item.product.title}
                </Link>
                {Object.keys(item.variant.attributes).length > 0 ? (
                  <p className="text-[13px] text-text-secondary">
                    {Object.entries(item.variant.attributes)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(", ")}
                  </p>
                ) : null}
                {item.variant.status !== "ACTIVE" ? (
                  <p className="mt-1 text-[13px] font-medium text-error">No longer available</p>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-border-strong">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1 || updateItem.isPending}
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        className="flex size-8 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-background-subtle disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]"
                      >
                        <Minus className="size-3" aria-hidden />
                      </button>
                      <span className="w-6 text-center text-[14px] tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={atStockLimit || updateItem.isPending}
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="flex size-8 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-background-subtle disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]"
                      >
                        <Plus className="size-3" aria-hidden />
                      </button>
                    </div>
                    <Button
                      variant="tertiary"
                      size="sm"
                      aria-label="Remove from cart"
                      isLoading={removeItem.isPending}
                      onClick={() => handleRemove(item)}
                      className="ml-auto text-text-secondary hover:text-error"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                )}
              </div>
              <p className="font-sans text-[15px] font-semibold tabular-nums text-text-primary">
                {formatMoney({ amountMinor: item.variant.priceAmount, currency: "INR" })}
              </p>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-[var(--radius-300)] border border-border p-[var(--space-300)]">
        <h2 className="text-[14px] font-medium text-text-primary">Order Summary</h2>
        <div className="mt-3 flex items-center justify-between text-[14px]">
          <span className="text-text-secondary">Subtotal ({cart.itemCount} items)</span>
          <span className="font-medium tabular-nums text-text-primary">
            {formatMoney({ amountMinor: cart.subtotalAmount, currency: "INR" })}
          </span>
        </div>
        <Button size="lg" className="mt-[var(--space-300)] w-full" asChild>
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
      </aside>
    </div>
  );
}
