"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "@dbk/utils";
import type { Id } from "@dbk/types";

export interface WishlistButtonProps {
  productId: Id;
  className?: string;
  /** Controlled by the consuming feature (e.g., apps/buyer's wishlist
   * feature) — this component holds no data-fetching or global-state
   * subscription of its own, per 11-frontend-architecture.md §8.2. */
  isWishlisted?: boolean;
  onToggle?: (productId: Id, nextValue: boolean) => void;
}

/** The leaf Client Component within ProductCard (§7.8) — only this small
 * button hydrates; the rest of the card stays server-rendered. */
export function WishlistButton({
  productId,
  className,
  isWishlisted = false,
  onToggle,
}: WishlistButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        onToggle?.(productId, !isWishlisted);
      }}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur-sm",
        "transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-[var(--size-icon-md)]",
          isWishlisted ? "fill-[var(--color-brand-primary)] text-brand-primary" : "text-text-secondary",
        )}
        aria-hidden
      />
    </button>
  );
}
