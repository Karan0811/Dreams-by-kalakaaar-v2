"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { ApiError, useAddToCart, useAddToWishlist, useWishlist, useRemoveFromWishlist } from "@dbk/api-client";
import { Button, FormField, Input, toast } from "@dbk/ui";
import type { Product } from "@dbk/types";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { useProductVariant } from "./ProductVariantContext";

/**
 * Variant Selector + Customization Panel + Add to Cart/Wishlist actions
 * (§3.13). Add to Cart is a mutation against the real Cart backend
 * (`useAddToCart`, Sprint 02).
 *
 * Phase 4: previously guarded only on `product.variantId` — a single
 * backend-picked default with no way for the buyer to choose a different
 * size/color, and no way to tell a sold-out *variant* apart from a
 * sold-out *product* (a product with some in-stock and some sold-out
 * variants showed as purchasable but silently added whichever variant the
 * backend happened to default to). Now sourced from `useProductVariant`'s
 * live selection, which resolves to a specific `ProductVariant` — its own
 * `availability`, not the aggregate product-level one, is what gates the
 * button and picks its label.
 */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const [selections, setSelections] = React.useState<Record<string, string>>({});
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { data: wishlist } = useWishlist();
  const { selectedVariant, isSelectionComplete } = useProductVariant(product);
  const isWishlisted = wishlist?.some((entry) => entry.productId === product.id) ?? false;

  const isSoldOut = selectedVariant ? selectedVariant.availability === "sold_out" : product.availability === "sold_out";
  const isUnavailableCombination = isSelectionComplete && !selectedVariant;

  const missingRequired = product.customizationFields.some(
    (field) => field.required && !selections[field.id]?.trim(),
  );

  function handleAddToCart() {
    if (!selectedVariant) {
      toast.error(
        isUnavailableCombination
          ? "That combination isn't available."
          : "This product isn't available for purchase yet.",
      );
      return;
    }
    addToCart.mutate(
      { variantId: selectedVariant.id, quantity: 1 },
      {
        onSuccess: () => toast.success("Added to cart"),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 401) {
            toast.error("Please sign in to add items to your cart.");
            return;
          }
          toast.error("Couldn't add this to your cart. Please try again.");
        },
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
      <ProductVariantSelector product={product} />

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
          disabled={isSoldOut || isUnavailableCombination || missingRequired}
          isLoading={addToCart.isPending}
          onClick={handleAddToCart}
        >
          {isUnavailableCombination
            ? "Not Available"
            : isSoldOut
              ? "Notify Me When Available"
              : "Add to Cart"}
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
