"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import { Button, Skeleton, toast } from "@dbk/ui";
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
  const { data: cart, isLoading } = useCart();
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-300)] border border-border bg-background-subtle py-[var(--space-1200)] text-center">
        <ShoppingBag className="size-10 text-text-secondary" aria-hidden />
        <div>
          <p className="text-[16px] font-medium text-text-primary">Your cart is empty</p>
          <p className="mt-1 text-[14px] text-text-secondary">
            Browse the catalog to find something you&apos;ll love.
          </p>
        </div>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
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
              className="flex gap-3 rounded-[var(--radius-300)] border border-border p-[var(--space-150)]"
            >
              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="text-[14px] font-medium text-text-primary hover:text-text-link"
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
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label="Decrease quantity"
                      disabled={item.quantity <= 1 || updateItem.isPending}
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    >
                      <Minus className="size-3" aria-hidden />
                    </Button>
                    <span className="w-6 text-center text-[14px] tabular-nums">{item.quantity}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label="Increase quantity"
                      disabled={atStockLimit || updateItem.isPending}
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    >
                      <Plus className="size-3" aria-hidden />
                    </Button>
                    <Button
                      variant="tertiary"
                      size="sm"
                      aria-label="Remove from cart"
                      isLoading={removeItem.isPending}
                      onClick={() => handleRemove(item)}
                      className="ml-auto"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                )}
              </div>
              <p className="font-sans text-[14px] font-semibold tabular-nums text-text-primary">
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
