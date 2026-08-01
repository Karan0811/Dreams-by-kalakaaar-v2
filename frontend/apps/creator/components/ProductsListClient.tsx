"use client";

import { useState } from "react";
import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { useCreatorProducts, useDeleteProduct } from "@dbk/api-client";
import type { CreatorProduct, ProductStatus } from "@dbk/types";
import { formatMoney } from "@dbk/utils";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from "@dbk/ui";

const TABS: { value: ProductStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_BADGE: Record<ProductStatus, { label: string; variant: "neutral" | "success" | "warning" | "error" | "info" }> = {
  DRAFT: { label: "Draft", variant: "neutral" },
  PENDING_APPROVAL: { label: "Pending approval", variant: "info" },
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  ARCHIVED: { label: "Archived", variant: "neutral" },
  REJECTED: { label: "Rejected", variant: "error" },
};

function cheapestPrice(product: CreatorProduct) {
  const prices = (product.variants ?? []).map((v) => v.priceAmount);
  if (prices.length === 0) return null;
  return formatMoney({ amountMinor: Math.min(...prices), currency: (product.variants?.[0]?.priceCurrency ?? "INR") as "INR" });
}

export function ProductsListClient({ storeId }: { storeId: string }) {
  const [tab, setTab] = useState<ProductStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CreatorProduct | null>(null);

  const { data, isLoading, isError, refetch } = useCreatorProducts(storeId, {
    status: tab === "ALL" ? undefined : tab,
    q: q || undefined,
  });
  const deleteProduct = useDeleteProduct(storeId);

  const products = data?.data ?? [];

  async function confirmDelete() {
    if (!pendingDelete) return;
    await deleteProduct.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={`min-h-[var(--size-touch-target-min)] rounded-[var(--radius-100)] px-3 text-[13px] font-medium ${
                tab === t.value
                  ? "bg-brand-primary text-text-on-brand"
                  : "text-text-secondary hover:bg-background-subtle"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your products…"
          aria-label="Search your products"
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card className="flex flex-col items-center gap-3 py-[var(--space-800)] text-center">
          <p className="text-[14px] font-medium text-text-primary">Couldn&apos;t load your products</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </Card>
      ) : products.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-[var(--space-1200)] text-center">
          <PackagePlus className="size-10 text-text-secondary" aria-hidden />
          <div>
            <p className="text-[16px] font-medium text-text-primary">
              {q || tab !== "ALL" ? "No products match" : "You haven't listed anything yet"}
            </p>
            <p className="mt-1 text-[14px] text-text-secondary">
              {q || tab !== "ALL" ? "Try a different search or filter." : "Create your first product to get started."}
            </p>
          </div>
          {!q && tab === "ALL" ? (
            <Button asChild>
              <Link href="/dashboard/products/new">New Product</Link>
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((product) => {
            const badge = STATUS_BADGE[product.status];
            const price = cheapestPrice(product);
            return (
              <Card key={product.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="truncate text-[15px] font-medium text-text-primary hover:underline"
                    >
                      {product.title}
                    </Link>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-text-secondary">
                    {price ?? "No price set"} · {product.variants?.length ?? 0} variant
                    {product.variants?.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/dashboard/products/${product.id}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="tertiary" size="sm" onClick={() => setPendingDelete(product)}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              {pendingDelete ? `"${pendingDelete.title}"` : "This product"} will be removed from your
              store and from search immediately. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={deleteProduct.isPending}>
              Delete product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
