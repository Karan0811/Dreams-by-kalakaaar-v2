"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import { Button, Skeleton } from "@dbk/ui";

export function CartView() {
  const { data: cart, isLoading } = useCart();

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

  return (
    <div className="grid gap-[var(--space-400)] lg:grid-cols-[1fr_320px]">
      <ul className="flex flex-col gap-[var(--space-200)]">
        {cart.items.map((item) => {
          const primaryImage = item.product.images[0];
          return (
            <li key={item.id} className="flex gap-3 rounded-[var(--radius-300)] border border-border p-[var(--space-150)]">
              {primaryImage ? (
                <div className="relative size-20 shrink-0 overflow-hidden rounded-[var(--radius-200)] bg-background-subtle">
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.altText}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col">
                <Link href={`/products/${item.product.slug}`} className="text-[14px] font-medium text-text-primary hover:text-text-link">
                  {item.product.title}
                </Link>
                <p className="text-[13px] text-text-secondary">{item.product.creator.displayName}</p>
                <p className="mt-1 text-[13px] text-text-secondary">Qty {item.quantity}</p>
              </div>
              <p className="font-sans text-[14px] font-semibold tabular-nums text-text-primary">
                {formatMoney(item.unitPrice)}
              </p>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-[var(--radius-300)] border border-border p-[var(--space-300)]">
        <h2 className="text-[14px] font-medium text-text-primary">Order Summary</h2>
        <div className="mt-3 flex items-center justify-between text-[14px]">
          <span className="text-text-secondary">Subtotal ({cart.itemCount} items)</span>
          <span className="font-medium tabular-nums text-text-primary">{formatMoney(cart.subtotal)}</span>
        </div>
        <Button size="lg" className="mt-[var(--space-300)] w-full" asChild>
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
      </aside>
    </div>
  );
}
