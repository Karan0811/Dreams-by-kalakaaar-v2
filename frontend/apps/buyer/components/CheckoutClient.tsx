"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingBag } from "lucide-react";
import { ApiError, useCart, useCreateOrder, useMyAddresses } from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import { Button, Card, EmptyState, ErrorState, RadioGroup, RadioGroupItem, Skeleton, toast } from "@dbk/ui";

/**
 * No payment integration this sprint (explicit brief constraint — see
 * `shared/db/schema/orders.ts`'s doc comment). Placing an order here
 * creates it directly in `PENDING` status; `POST /users/me/orders` (and
 * `checkoutFromCart` beneath it) re-validates the cart, re-fetches
 * authoritative prices, and computes the total entirely server-side —
 * nothing shown on this screen is trusted as-is when the order is placed.
 */
export function CheckoutClient() {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading, isError: addressesError, refetch } = useMyAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const createOrder = useCreateOrder();

  const isLoading = cartLoading || addressesLoading;

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (addressesError) {
    return <ErrorState description="We couldn't load your addresses." onRetry={() => refetch()} />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Add something to your cart before checking out."
        action={
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        }
      />
    );
  }

  const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0] ?? null;
  const activeAddressId = selectedAddressId ?? defaultAddress?.id ?? null;

  function handlePlaceOrder() {
    if (!activeAddressId) {
      toast.error("Please choose a shipping address first.");
      return;
    }

    createOrder.mutate(
      { shippingAddressId: activeAddressId },
      {
        onSuccess: (order) => {
          toast.success("Order placed!");
          router.push(`/account/orders/${order.id}`);
        },
        onError: (error) => {
          // The cart/pricing/stock re-validation that produces these lives
          // entirely server-side in `checkoutFromCart` — these messages
          // (empty cart, stock/availability changed since this page
          // loaded, shipping address no longer exists) are the server's
          // authoritative answer, not a client-side guess.
          if (error instanceof ApiError && (error.code === 'VALIDATION_ERROR' || error.code === 'NOT_FOUND')) {
            toast.error(error.message);
            return;
          }
          toast.error("Couldn't place your order. Please try again.");
        },
      },
    );
  }

  return (
    <div className="grid gap-[var(--space-400)] lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-[var(--space-300)]">
        <Link href="/cart" className="flex items-center gap-1 text-[13px] font-medium text-text-link hover:underline">
          <ArrowLeft className="size-3" aria-hidden /> Back to cart
        </Link>

        <Card>
          <h2 className="flex items-center gap-2 text-[14px] font-medium text-text-primary">
            <MapPin className="size-4" aria-hidden /> Shipping Address
          </h2>
          {!addresses || addresses.length === 0 ? (
            <div className="mt-3">
              <p className="text-[13px] text-text-secondary">You don&apos;t have any saved addresses yet.</p>
              <Button asChild variant="secondary" className="mt-2">
                <Link href="/account/addresses">Add an address</Link>
              </Button>
            </div>
          ) : (
            <RadioGroup
              className="mt-3 flex flex-col gap-2"
              value={activeAddressId ?? undefined}
              onValueChange={setSelectedAddressId}
            >
              {addresses.map((address) => (
                <label
                  key={address.id}
                  htmlFor={`address-${address.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-300)] border border-border p-[var(--space-150)] has-[[data-state=checked]]:border-brand-primary"
                >
                  <RadioGroupItem id={`address-${address.id}`} value={address.id} className="mt-1" />
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">{address.label}</p>
                    <p className="text-[13px] text-text-secondary">{address.recipientName}</p>
                    <p className="text-[13px] text-text-secondary">
                      {address.line1}, {address.city}, {address.state} {address.postalCode}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          )}
        </Card>
      </div>

      <aside className="h-fit rounded-[var(--radius-300)] border border-border p-[var(--space-300)]">
        <h2 className="text-[14px] font-medium text-text-primary">Order Summary</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between text-[13px] text-text-secondary">
              <span>
                {item.product.title} × {item.quantity}
              </span>
              <span className="tabular-nums">
                {formatMoney({ amountMinor: item.variant.priceAmount * item.quantity, currency: "INR" })}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[14px] font-medium text-text-primary">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney({ amountMinor: cart.subtotalAmount, currency: "INR" })}</span>
        </div>
        <p className="mt-3 text-[13px] text-text-secondary">
          Cash/pay-on-delivery only for now — online payment isn&apos;t available yet.
        </p>
        <Button
          size="lg"
          className="mt-[var(--space-300)] w-full"
          disabled={!activeAddressId || !addresses || addresses.length === 0}
          isLoading={createOrder.isPending}
          onClick={handlePlaceOrder}
        >
          Place Order
        </Button>
      </aside>
    </div>
  );
}
