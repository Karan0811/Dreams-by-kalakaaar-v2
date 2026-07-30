"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { useAddToCart } from "@dbk/api-client";
import { Button, FormField, Input, toast } from "@dbk/ui";
import type { Product } from "@dbk/types";

/**
 * Customization Panel + Add to Cart/Wishlist actions (§3.13). Add to Cart is
 * an optimistic mutation (§10.3) — the button reflects loading state, and a
 * failure is surfaced via toast with the cart cache rolled back automatically
 * inside `useAddToCart`.
 */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const [selections, setSelections] = React.useState<Record<string, string>>({});
  const addToCart = useAddToCart();
  const isSoldOut = product.availability === "sold_out";

  const missingRequired = product.customizationFields.some(
    (field) => field.required && !selections[field.id]?.trim(),
  );

  function handleAddToCart() {
    addToCart.mutate(
      { productId: product.id, quantity: 1, customizationSelections: selections },
      {
        onSuccess: () => toast.success("Added to cart"),
        onError: () => toast.error("Couldn't add this to your cart. Please try again."),
      },
    );
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
          aria-label="Add to wishlist"
          onClick={() => toast("Saved to your wishlist")}
        >
          <Heart aria-hidden />
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
