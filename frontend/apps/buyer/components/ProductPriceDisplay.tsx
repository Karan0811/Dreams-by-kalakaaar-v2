"use client";

import { formatMoney } from "@dbk/utils";
import { AvailabilityStatusBadge } from "@dbk/ui";
import type { Product } from "@dbk/types";
import { useProductVariant } from "./ProductVariantContext";

/**
 * Phase 4 — the header price/availability was static server-rendered HTML
 * showing the product's base price and aggregate availability, which
 * didn't move when a buyer picked a different size/color even though
 * variants can have different prices and different stock. Small client
 * island so just this block re-renders on selection, instead of the price
 * living frozen at whatever the default variant happened to be.
 */
export function ProductPriceDisplay({ product }: { product: Product }) {
  const { selectedVariant, isSelectionComplete } = useProductVariant(product);
  const price = selectedVariant?.price ?? product.price;
  const availability = selectedVariant?.availability ?? (isSelectionComplete ? "sold_out" : product.availability);

  return (
    <div className="flex items-center gap-3">
      <p className="font-sans text-[24px] font-semibold tabular-nums text-text-primary">{formatMoney(price)}</p>
      {product.compareAtPrice ? (
        <p className="text-[15px] text-text-secondary line-through">{formatMoney(product.compareAtPrice)}</p>
      ) : null}
      <AvailabilityStatusBadge status={availability} />
    </div>
  );
}
