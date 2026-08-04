"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteProduct, useTransitionProductStatus, ApiError } from "@dbk/api-client";
import type { CreatorProduct } from "@dbk/types";
import { Alert, Badge, Button, Card, ConfirmDialog } from "@dbk/ui";

const STATUS_BADGE = {
  DRAFT: { label: "Draft", variant: "neutral" as const },
  PENDING_APPROVAL: { label: "Pending approval", variant: "info" as const },
  ACTIVE: { label: "Active", variant: "success" as const },
  PAUSED: { label: "Paused", variant: "warning" as const },
  ARCHIVED: { label: "Archived", variant: "neutral" as const },
  REJECTED: { label: "Rejected", variant: "error" as const },
};

export function ProductStatusPanel({ storeId, product }: { storeId: string; product: CreatorProduct }) {
  const router = useRouter();
  const transition = useTransitionProductStatus(storeId, product.id);
  const deleteProduct = useDeleteProduct(storeId);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const badge = STATUS_BADGE[product.status];

  async function handleDelete() {
    await deleteProduct.mutateAsync(product.id);
    router.push("/dashboard/products");
  }

  return (
    <Card className="flex flex-col gap-[var(--space-200)]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-text-secondary">Status</p>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {transition.isError ? (
        <Alert variant="error" title="Couldn't update status">
          {transition.error instanceof ApiError ? transition.error.message : "Something went wrong."}
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(product.status === "DRAFT" || product.status === "PAUSED") && (
          <Button
            size="sm"
            onClick={() => transition.mutate("ACTIVE")}
            isLoading={transition.isPending && transition.variables === "ACTIVE"}
          >
            Publish
          </Button>
        )}
        {product.status === "ACTIVE" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => transition.mutate("PAUSED")}
            isLoading={transition.isPending && transition.variables === "PAUSED"}
          >
            Pause
          </Button>
        )}
        {product.status !== "ARCHIVED" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => transition.mutate("ARCHIVED")}
            isLoading={transition.isPending && transition.variables === "ARCHIVED"}
          >
            Archive
          </Button>
        )}
        <Button variant="tertiary" size="sm" onClick={() => setConfirmingDelete(true)}>
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete this product?"
        description={`"${product.title}" will be removed from your store and from search immediately. This can't be undone.`}
        confirmLabel="Delete product"
        destructive
        isConfirming={deleteProduct.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
