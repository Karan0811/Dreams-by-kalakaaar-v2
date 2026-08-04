"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, PackagePlus } from "lucide-react";
import {
  useBulkArchiveProducts,
  useBulkDeleteProducts,
  useCreatorProducts,
  useDeleteProduct,
  useDuplicateProduct,
  type BulkActionResult,
} from "@dbk/api-client";
import type { CreatorProduct, ProductStatus } from "@dbk/types";
import { formatMoney } from "@dbk/utils";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SearchInput,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
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

function bulkResultMessage(action: string, result: BulkActionResult): { variant: "success" | "warning"; text: string } {
  if (result.failed.length === 0) {
    return { variant: "success", text: `${action} ${result.succeeded.length} product${result.succeeded.length === 1 ? "" : "s"}.` };
  }
  return {
    variant: "warning",
    text: `${action} ${result.succeeded.length} product${result.succeeded.length === 1 ? "" : "s"}, but ${result.failed.length} failed. Try those again individually.`,
  };
}

export function ProductsListClient({ storeId }: { storeId: string }) {
  const [tab, setTab] = useState<ProductStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CreatorProduct | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<"archive" | "delete" | null>(null);
  const [bulkNotice, setBulkNotice] = useState<{ variant: "success" | "warning"; text: string } | null>(null);

  const { data, isLoading, isError, refetch } = useCreatorProducts(storeId, {
    status: tab === "ALL" ? undefined : tab,
    q: q || undefined,
  });
  const deleteProduct = useDeleteProduct(storeId);
  const duplicateProduct = useDuplicateProduct(storeId);
  const bulkArchive = useBulkArchiveProducts(storeId);
  const bulkDelete = useBulkDeleteProducts(storeId);

  const products = data?.data ?? [];
  const hasFilters = Boolean(q) || tab !== "ALL";

  async function confirmDelete() {
    if (!pendingDelete) return;
    await deleteProduct.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(pendingDelete.id);
      return next;
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === products.length ? new Set() : new Set(products.map((p) => p.id))));
  }

  async function runBulkAction() {
    const ids = Array.from(selected);
    if (bulkConfirm === "archive") {
      const result = await bulkArchive.mutateAsync(ids);
      setBulkNotice(bulkResultMessage("Archived", result));
    } else if (bulkConfirm === "delete") {
      const result = await bulkDelete.mutateAsync(ids);
      setBulkNotice(bulkResultMessage("Deleted", result));
    }
    setSelected(new Set());
    setBulkConfirm(null);
  }

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      {bulkNotice ? (
        <Alert variant={bulkNotice.variant} title={bulkNotice.text} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(value) => setTab(value as ProductStatus | "ALL")}>
          <TabsList aria-label="Filter by status">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          placeholder="Search your products…"
          aria-label="Search your products"
          className="max-w-xs"
        />
      </div>

      {selected.size > 0 ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 bg-background-subtle">
          <p className="text-[14px] font-medium text-text-primary">
            {selected.size} selected
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBulkConfirm("archive")}>
              Archive selected
            </Button>
            <Button variant="tertiary" size="sm" onClick={() => setBulkConfirm("delete")}>
              Delete selected
            </Button>
            <Button variant="tertiary" size="sm" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Couldn't load your products" onRetry={() => refetch()} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title={hasFilters ? "No products match" : "You haven't listed anything yet"}
          description={hasFilters ? "Try a different search or filter." : "Create your first product to get started."}
          action={
            !hasFilters ? (
              <Button asChild>
                <Link href="/dashboard/products/new">New Product</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1 text-[13px] text-text-secondary">
            <Checkbox
              id="select-all-products"
              checked={selected.size === products.length}
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all-products">Select all</label>
          </div>
          {products.map((product) => {
            const badge = STATUS_BADGE[product.status];
            const price = cheapestPrice(product);
            return (
              <Card key={product.id} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Checkbox
                    checked={selected.has(product.id)}
                    onCheckedChange={() => toggleSelected(product.id)}
                    aria-label={`Select ${product.title}`}
                  />
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
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/dashboard/products/${product.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => duplicateProduct.mutate(product)}
                    isLoading={duplicateProduct.isPending && duplicateProduct.variables?.id === product.id}
                    aria-label={`Duplicate ${product.title}`}
                  >
                    <Copy className="size-4" aria-hidden />
                    Duplicate
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

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this product?"
        description={`${
          pendingDelete ? `"${pendingDelete.title}"` : "This product"
        } will be removed from your store and from search immediately. This can't be undone.`}
        confirmLabel="Delete product"
        destructive
        isConfirming={deleteProduct.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={bulkConfirm !== null}
        onOpenChange={(open) => !open && setBulkConfirm(null)}
        title={bulkConfirm === "delete" ? `Delete ${selected.size} products?` : `Archive ${selected.size} products?`}
        description={
          bulkConfirm === "delete"
            ? "These products will be removed from your store and from search immediately. This can't be undone."
            : "These products will be paused and hidden from buyers. You can unarchive them individually later."
        }
        confirmLabel={bulkConfirm === "delete" ? "Delete products" : "Archive products"}
        destructive={bulkConfirm === "delete"}
        isConfirming={bulkArchive.isPending || bulkDelete.isPending}
        onConfirm={runBulkAction}
      />
    </div>
  );
}
