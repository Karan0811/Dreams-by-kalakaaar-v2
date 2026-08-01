"use client";

import { useState } from "react";
import { useAdjustInventory, ApiError } from "@dbk/api-client";
import type { CreatorProductVariant } from "@dbk/types";
import { formatMoney } from "@dbk/utils";
import { Alert, Button, Card, Input } from "@dbk/ui";

function VariantRow({
  storeId,
  productId,
  variant,
}: {
  storeId: string;
  productId: string;
  variant: CreatorProductVariant;
}) {
  const [delta, setDelta] = useState("");
  const adjust = useAdjustInventory(storeId, productId);

  function applyDelta(sign: 1 | -1) {
    const value = Number(delta);
    if (!value || Number.isNaN(value)) return;
    adjust.mutate({ variantId: variant.id, quantityDelta: sign * Math.abs(Math.trunc(value)) });
    setDelta("");
  }

  const lowStock =
    variant.quantityAvailable !== null &&
    variant.lowStockThreshold !== null &&
    variant.quantityAvailable <= variant.lowStockThreshold;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-[var(--space-150)] last:border-b-0">
      <div>
        <p className="text-[14px] text-text-primary">
          {formatMoney({ amountMinor: variant.priceAmount, currency: variant.priceCurrency as "INR" })}
          {variant.skuReference ? <span className="text-text-secondary"> · {variant.skuReference}</span> : null}
        </p>
        <p className={`text-[13px] ${lowStock ? "text-warning" : "text-text-secondary"}`}>
          {variant.quantityAvailable ?? 0} in stock{lowStock ? " · low stock" : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="0"
          aria-label={`Adjust stock for ${variant.skuReference ?? variant.id}`}
          className="w-20"
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => applyDelta(1)} isLoading={adjust.isPending}>
          Add
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => applyDelta(-1)} isLoading={adjust.isPending}>
          Remove
        </Button>
      </div>
    </div>
  );
}

export function ProductInventoryPanel({
  storeId,
  productId,
  variants,
}: {
  storeId: string;
  productId: string;
  variants: CreatorProductVariant[];
}) {
  const adjust = useAdjustInventory(storeId, productId);

  return (
    <Card className="flex flex-col gap-[var(--space-200)]">
      <p className="text-[13px] font-medium text-text-secondary">Inventory</p>
      {adjust.isError ? (
        <Alert variant="error" title="Couldn't update stock">
          {adjust.error instanceof ApiError ? adjust.error.message : "Something went wrong."}
        </Alert>
      ) : null}
      {variants.length === 0 ? (
        <p className="text-[13px] text-text-secondary">No variants.</p>
      ) : (
        <div>
          {variants.map((variant) => (
            <VariantRow key={variant.id} storeId={storeId} productId={productId} variant={variant} />
          ))}
        </div>
      )}
    </Card>
  );
}
