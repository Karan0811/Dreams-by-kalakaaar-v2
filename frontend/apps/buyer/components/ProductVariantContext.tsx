"use client";

import * as React from "react";
import type { Product, ProductVariant } from "@dbk/types";

/**
 * Phase 4 — buyer variant selection. `ProductPurchasePanel` (the
 * size/color picker + "Add to Cart") and `StickyAddToCartBar` (the
 * mobile-only sticky CTA, `page.tsx`'s sibling of the panel) both need to
 * act on the *same* selected variant — but `page.tsx` is a Server
 * Component, so the two Client Components can't share plain lifted
 * `useState`. This is a small, page-scoped context (not a new global
 * store) purely so those two existing components agree on one selection,
 * matching how `ProductEditView`'s `liveFields` lifts shared state between
 * its own sibling client components one level up.
 */

export interface AttributeSelection {
  [attributeKey: string]: string;
}

interface ProductVariantContextValue {
  variants: ProductVariant[];
  attributeGroups: Array<{ key: string; values: string[] }>;
  selection: AttributeSelection;
  setAttribute: (key: string, value: string) => void;
  /** The variant matching the current selection, if the combination is purchasable. */
  selectedVariant: ProductVariant | undefined;
  /** True once every attribute dimension has a value chosen (doesn't guarantee `selectedVariant` exists — an invalid combination is still "complete"). */
  isSelectionComplete: boolean;
}

const ProductVariantContext = React.createContext<ProductVariantContextValue | null>(null);

function attributeGroupsFor(variants: ProductVariant[]) {
  const groups = new Map<string, Set<string>>();
  for (const variant of variants) {
    for (const [key, value] of Object.entries(variant.attributes)) {
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key)!.add(value);
    }
  }
  return [...groups.entries()].map(([key, values]) => ({ key, values: [...values] }));
}

function findVariant(variants: ProductVariant[], selection: AttributeSelection) {
  return variants.find((v) =>
    Object.entries(selection).every(([key, value]) => v.attributes[key] === value),
  );
}

export function ProductVariantProvider({ product, children }: { product: Product; children: React.ReactNode }) {
  const variants = React.useMemo(() => product.variants ?? [], [product.variants]);
  const attributeGroups = React.useMemo(() => attributeGroupsFor(variants), [variants]);

  // Preselect from the backend's own default variant (§ getPublicProductDetail's
  // `defaultVariant` — the first in-stock ACTIVE variant) so a buyer who
  // never touches the selector still adds a real, purchasable variant, not
  // an arbitrary first-in-array one that might be sold out.
  const initialVariant = variants.find((v) => v.id === product.variantId) ?? variants[0];
  const [selection, setSelection] = React.useState<AttributeSelection>(
    initialVariant?.attributes ?? {},
  );

  const setAttribute = React.useCallback((key: string, value: string) => {
    setSelection((prev) => ({ ...prev, [key]: value }));
  }, []);

  const selectedVariant = findVariant(variants, selection);
  const isSelectionComplete = attributeGroups.every((g) => selection[g.key] !== undefined);

  return (
    <ProductVariantContext.Provider
      value={{ variants, attributeGroups, selection, setAttribute, selectedVariant, isSelectionComplete }}
    >
      {children}
    </ProductVariantContext.Provider>
  );
}

/**
 * Safe outside a Provider too (returns a stable single-variant/no-variant
 * fallback) so components that render both inside and outside the product
 * page's variant-aware region — none currently do, but this keeps the hook
 * from becoming a hard coupling — don't need a defensive null-check at
 * every call site.
 */
export function useProductVariant(product: Product): ProductVariantContextValue {
  const ctx = React.useContext(ProductVariantContext);
  if (ctx) return ctx;
  const variants = product.variants ?? [];
  const fallback = variants.find((v) => v.id === product.variantId);
  return {
    variants,
    attributeGroups: [],
    selection: fallback?.attributes ?? {},
    setAttribute: () => {},
    selectedVariant: fallback,
    isSelectionComplete: true,
  };
}
