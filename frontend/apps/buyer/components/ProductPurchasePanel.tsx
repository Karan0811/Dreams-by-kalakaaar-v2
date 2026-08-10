"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { useAddToCart, useAddToWishlist, useWishlist, useRemoveFromWishlist } from "@dbk/api-client";
import { Button, FormField, Input, toast } from "@dbk/ui";
import type { Product } from "@dbk/types";

/**
 * Customization Panel + Add to Cart/Wishlist actions (§3.13). Add to Cart is
 * a mutation against the real Cart backend (`useAddToCart`, Sprint 02) —
 * it's guarded on `product.variantId` being present, since this
 * aspirational catalog page (see `@dbk/types`'s `Product` doc comment)
 * doesn't always carry one yet; when it's missing, the button explains why
 * instead of silently doing nothing or fabricating a fake purchase target.
 */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const [selections, setSelections] = React.useState<Record<string, string>>({});
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { data: wishlist } = useWishlist();
  const isSoldOut = product.availability === "sold_out";
  const isWishlisted = wishlist?.some((entry) => entry.productId === product.id) ?? false;

  const missingRequired = product.customizationFields.some(
    (field) => field.required && !selections[field.id]?.trim(),
  );

  function handleAddToCart() {
    if (!product.variantId) {
      toast.error("This product isn't available for purchase yet.");
      return;
    }
    addToCart.mutate(
      { variantId: product.variantId, quantity: 1 },
      {
        onSuccess: () => toast.success("Added to cart"),
        onError: () => toast.error("Couldn't add this to your cart. Please try again."),
      },
    );
  }

  function handleToggleWishlist() {
    if (isWishlisted) {
      removeFromWishlist.mutate(product.id, {
        onSuccess: () => toast("Removed from your wishlist"),
        onError: () => toast.error("Couldn't update your wishlist. Please try again."),
      });
    } else {
      addToWishlist.mutate(product.id, {
        onSuccess: () => toast.success("Saved to your wishlist"),
        onError: () => toast.error("Couldn't update your wishlist. Please try again."),
      });
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      {product.customizationFields.length > 0 ? (
        <div className="flex flex-col gap-[var(--space-200)]">
          {product.customizationFields.map((field) => (
            <FormField key={field.id} id={`customization-${field.id}`} label={field.label} required={field.required}>
              <Input
                maxLength={field.maxLength}
                value={selections[field.id] ?? ""}
                onChange={(e) => setSelections((prev) => ({ ...prev, [field.id]: e.target.value }))}
              />
            </FormField>
          ))}
        </div>
      ) : null}

      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          disabled={isSoldOut || missingRequired}
          isLoading={addToCart.isPending}
          onClick={handleAddToCart}
        >
          {isSoldOut ? "Notify Me When Available" : "Add to Cart"}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          isLoading={addToWishlist.isPending || removeFromWishlist.isPending}
          onClick={handleToggleWishlist}
        >
          <Heart aria-hidden fill={isWishlisted ? "currentColor" : "none"} />
        </Button>
      </div>

      {product.leadTimeDays ? (
        <p className="text-[13px] text-text-secondary">
          Made to order — ships in about {product.leadTimeDays} days.
        </p>
      ) : null}
    </div>
  );
}
