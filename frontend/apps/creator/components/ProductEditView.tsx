"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCreatorProduct } from "@dbk/api-client";
import { Alert, ErrorState, Skeleton } from "@dbk/ui";
import { ProductEditForm } from "./ProductEditForm";
import { ProductStatusPanel } from "./ProductStatusPanel";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductInventoryPanel } from "./ProductInventoryPanel";
import { ProductVariantManager } from "./ProductVariantManager";
import { ProductPreviewCard } from "./ProductPreviewCard";

export function ProductEditView({ storeId, productId }: { storeId: string; productId: string }) {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "true";
  const { data: product, isLoading, isError, refetch } = useCreatorProduct(storeId, productId);

  // Live Preview: updated on every keystroke by ProductEditForm (no
  // debounce, unlike autosave itself — the preview should feel instant
  // even though persistence doesn't).
  const [liveFields, setLiveFields] = useState<{ title: string; description: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-[var(--space-300)]">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !product) {
    return <ErrorState title="Couldn't load this product" onRetry={() => refetch()} />;
  }

  const previewProduct = liveFields ? { ...product, ...liveFields } : product;

  return (
    <div className="grid grid-cols-1 gap-[var(--space-400)] lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-[var(--space-400)]">
        {justCreated ? (
          <Alert variant="success" title="Product created">
            Add at least one photo, then publish when you&apos;re ready.
          </Alert>
        ) : null}
        <ProductEditForm storeId={storeId} product={product} onLiveChange={setLiveFields} />
        <ProductVariantManager storeId={storeId} productId={productId} />
        <ProductInventoryPanel storeId={storeId} productId={productId} variants={product.variants ?? []} />
      </div>
      <div className="flex flex-col gap-[var(--space-300)]">
        <ProductStatusPanel storeId={storeId} product={product} />
        <ProductImageGallery storeId={storeId} productId={productId} media={product.media ?? []} />
        <ProductPreviewCard product={previewProduct} />
      </div>
    </div>
  );
}
