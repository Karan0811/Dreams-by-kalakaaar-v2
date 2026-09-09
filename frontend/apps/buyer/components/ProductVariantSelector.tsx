"use client";

import { cn } from "@dbk/utils";
import type { Product, ProductVariant } from "@dbk/types";
import { useProductVariant } from "./ProductVariantContext";

/**
 * Phase 4 — one row of pill buttons per attribute dimension (e.g. a "Size"
 * row and a "Color" row), each option showing whether *some* combination
 * including it is still purchasable. A specific option is only ever
 * disabled when every variant containing it is sold out — not simply
 * because it isn't part of the *currently* selected combination, so
 * picking "Size" first doesn't wrongly grey out "Color" options that are
 * still valid pairings.
 */
export function ProductVariantSelector({ product }: { product: Product }) {
  const { variants, attributeGroups, selection, setAttribute } = useProductVariant(product);

  if (attributeGroups.length === 0) return null;

  return (
    <div className="flex flex-col gap-[var(--space-200)]">
      {attributeGroups.map((group) => (
        <div key={group.key}>
          <p className="mb-[var(--space-100)] text-[13px] font-medium capitalize text-text-primary">
            {group.key}
            {selection[group.key] ? <span className="font-normal text-text-secondary"> · {selection[group.key]}</span> : null}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={group.key}>
            {group.values.map((value) => {
              const isSelected = selection[group.key] === value;
              const variantsWithValue = variants.filter((v) => v.attributes[group.key] === value);
              const isFullyUnavailable = variantsWithValue.every((v: ProductVariant) => v.availability === "sold_out");

              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isFullyUnavailable}
                  onClick={() => setAttribute(group.key, value)}
                  className={cn(
                    "min-h-[2.25rem] rounded-full border px-[var(--space-200)] text-[13px] font-medium transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
                    isSelected
                      ? "border-brand-primary bg-brand-primary text-text-on-brand shadow-[var(--shadow-sm)]"
                      : "border-border-strong bg-surface text-text-primary hover:border-brand-primary hover:text-brand-primary",
                    isFullyUnavailable && "cursor-not-allowed border-border text-text-placeholder line-through hover:border-border hover:text-text-placeholder",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
