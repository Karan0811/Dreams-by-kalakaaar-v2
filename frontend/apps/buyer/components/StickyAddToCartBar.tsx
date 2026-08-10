"use client";

import { useAddToCart } from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import { Button, toast } from "@dbk/ui";
import type { Product } from "@dbk/types";

/**
 * Phase 3 — sticky mobile CTA. Mobile-only (`lg:hidden`); on larger screens
 * `ProductPurchasePanel` is already in view without scrolling, so a sticky
 * duplicate would just be visual noise. Deliberately does NOT duplicate
 * `ProductPurchasePanel`'s customization form (that would mean two live
 * copies of the same form state and duplicate field ids) — if the product
 * has required customization fields, tapping this scrolls up to the real
 * panel instead of attempting a same-request add.
 */
export function StickyAddToCartBar({ product }: { product: Product }) {
  const addToCart = useAddToCart();
  const isSoldOut = product.availability === "sold_out";
  const needsCustomization = product.customizationFields.some((f) => f.required);

  function handleClick() {
    if (needsCustomization) {
      document.getElementById("purchase-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] flex items-center justify-between gap-3 border-t border-border bg-surface px-[var(--space-200)] py-[var(--space-150)] shadow-[0_-2px_8px_rgba(0,0,0,0.06)] lg:hidden">
      <p className="font-sans text-[18px] font-semibold tabular-nums text-text-primary">
        {formatMoney(product.price)}
      </p>
      <Button
        size="lg"
        disabled={isSoldOut}
        isLoading={addToCart.isPending}
        onClick={handleClick}
        className="flex-1 max-w-[220px]"
      >
        {isSoldOut ? "Notify Me" : needsCustomization ? "Customize & Add" : "Add to Cart"}
      </Button>
    </div>
  );
}
