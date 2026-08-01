"use client";

import { useSearchParams } from "next/navigation";
import { useCreatorProduct } from "@dbk/api-client";
import { Alert, Button, Card, Skeleton } from "@dbk/ui";
import { ProductEditForm } from "./ProductEditForm";
import { ProductStatusPanel } from "./ProductStatusPanel";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductInventoryPanel } from "./ProductInventoryPanel";
import { ProductPreviewCard } from "./ProductPreviewCard";

export function ProductEditView({ storeId, productId }: { storeId: string; productId: string }) {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "true";
  const { data: product, isLoading, isError, refetch } = useCreatorProduct(storeId, productId);

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
    return (
      <Card className="flex flex-col items-center gap-3 py-[var(--space-800)] text-center">
        <p className="text-[14px] font-medium text-text-primary">Couldn&apos;t load this product</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[var(--space-400)] lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-[var(--space-400)]">
        {justCreated ? (
          <Alert variant="success" title="Product created">
            Add at least one photo, then publish when you&apos;re ready.
          </Alert>
        ) : null}
        <ProductEditForm storeId={storeId} product={product} />
        <ProductInventoryPanel storeId={storeId} productId={productId} variants={product.variants ?? []} />
      </div>
      <div className="flex flex-col gap-[var(--space-300)]">
        <ProductStatusPanel storeId={storeId} product={product} />
        <ProductImageGallery storeId={storeId} productId={productId} media={product.media ?? []} />
        <ProductPreviewCard product={product} />
      </div>
    </div>
  );
}
