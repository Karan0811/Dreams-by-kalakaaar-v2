"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Archive, Pencil, Plus } from "lucide-react";
import {
  useProductVariants,
  useCreateProductVariant,
  useUpdateProductVariant,
  useArchiveProductVariant,
} from "@dbk/api-client";
import { formatMoney } from "@dbk/utils";
import type { ProductVariantRecord } from "@dbk/types";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ErrorState,
  FormField,
  Input,
  Skeleton,
  toast,
} from "@dbk/ui";

const variantFormSchema = z.object({
  priceAmount: z.coerce.number().int().nonnegative("Price can't be negative"),
  skuReference: z.string().trim().max(64).optional(),
  attributesJson: z.string().trim().optional(),
});
type VariantFormInput = z.infer<typeof variantFormSchema>;

function parseAttributes(json?: string): Record<string, string> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
      );
    }
  } catch {
    // falls through to empty
  }
  return {};
}

function VariantFormDialog({
  open,
  onOpenChange,
  storeId,
  productId,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  productId: string;
  editing: ProductVariantRecord | null;
}) {
  const createVariant = useCreateProductVariant(storeId, productId);
  const updateVariant = useUpdateProductVariant(storeId, productId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormInput>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: editing
      ? {
          priceAmount: editing.priceAmount,
          skuReference: editing.skuReference ?? "",
          attributesJson: JSON.stringify(editing.attributes),
        }
      : { priceAmount: 0, skuReference: "", attributesJson: "{}" },
  });

  async function onSubmit(values: VariantFormInput) {
    try {
      if (editing) {
        await updateVariant.mutateAsync({
          variantId: editing.id,
          priceAmount: values.priceAmount,
          skuReference: values.skuReference || undefined,
          attributes: parseAttributes(values.attributesJson),
        });
        toast.success("Variant updated");
      } else {
        await createVariant.mutateAsync({
          priceAmount: values.priceAmount,
          skuReference: values.skuReference || undefined,
          attributes: parseAttributes(values.attributesJson),
          initialQuantity: 0,
        });
        toast.success("Variant added");
      }
      onOpenChange(false);
      reset();
    } catch {
      toast.error("Couldn't save this variant. The SKU may already be in use.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit variant" : "Add a variant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--space-200)]">
          <FormField id="priceAmount" label="Price (in paise)" error={errors.priceAmount?.message} required>
            <Input type="number" min={0} {...register("priceAmount")} />
          </FormField>
          <FormField id="skuReference" label="SKU" error={errors.skuReference?.message}>
            <Input {...register("skuReference")} />
          </FormField>
          <FormField
            id="attributesJson"
            label="Attributes (JSON)"
            error={errors.attributesJson?.message}
          >
            <Input placeholder='{"size":"8","color":"gold"}' {...register("attributesJson")} />
          </FormField>
          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
            {editing ? "Save changes" : "Add Variant"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProductVariantManager({ storeId, productId }: { storeId: string; productId: string }) {
  const { data: variants, isLoading, isError, refetch } = useProductVariants(storeId, productId);
  const archiveVariant = useArchiveProductVariant(storeId, productId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductVariantRecord | null>(null);
  const [pendingArchive, setPendingArchive] = useState<ProductVariantRecord | null>(null);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) return <ErrorState description="We couldn't load variants." onRetry={() => refetch()} />;

  async function confirmArchive() {
    if (!pendingArchive) return;
    try {
      await archiveVariant.mutateAsync(pendingArchive.id);
      toast.success("Variant archived");
    } catch {
      toast.error("Couldn't archive this variant — a product must keep at least one active variant.");
    } finally {
      setPendingArchive(null);
    }
  }

  return (
    <Card className="flex flex-col gap-[var(--space-200)]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-text-secondary">Variants</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-3.5" aria-hidden /> Add Variant
        </Button>
      </div>

      {!variants || variants.length === 0 ? (
        <p className="text-[13px] text-text-secondary">No variants yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {variants.map((variant) => (
            <li key={variant.id} className="flex items-center justify-between border-b border-border pb-2 last:border-b-0">
              <div>
                <p className="text-[14px] text-text-primary">
                  {formatMoney({ amountMinor: variant.priceAmount, currency: variant.priceCurrency as "INR" })}
                  {variant.skuReference ? <span className="text-text-secondary"> · {variant.skuReference}</span> : null}
                </p>
                {Object.keys(variant.attributes).length > 0 ? (
                  <p className="text-[12px] text-text-secondary">
                    {Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
                  </p>
                ) : null}
                {variant.status === "ARCHIVED" ? <Badge variant="neutral">Archived</Badge> : null}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="tertiary"
                  size="sm"
                  aria-label="Edit variant"
                  onClick={() => {
                    setEditing(variant);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                {variant.status === "ACTIVE" ? (
                  <Button
                    variant="tertiary"
                    size="sm"
                    aria-label="Archive variant"
                    onClick={() => setPendingArchive(variant)}
                  >
                    <Archive className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <VariantFormDialog open={formOpen} onOpenChange={setFormOpen} storeId={storeId} productId={productId} editing={editing} />
      <ConfirmDialog
        open={pendingArchive !== null}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title="Archive this variant?"
        description="Archived variants can no longer be purchased, but past orders referencing them are unaffected."
        destructive
        confirmLabel="Archive"
        isConfirming={archiveVariant.isPending}
        onConfirm={confirmArchive}
      />
    </Card>
  );
}
