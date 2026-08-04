"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productEditFormSchema, type ProductEditFormInput } from "@dbk/utils";
import { useUpdateProduct, ApiError } from "@dbk/api-client";
import type { CreatorProduct } from "@dbk/types";
import { Alert, Button, FormField, Input, Textarea } from "@dbk/ui";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

const AUTOSAVE_DELAY_MS = 1500;

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export function ProductEditForm({
  storeId,
  product,
  onLiveChange,
}: {
  storeId: string;
  product: CreatorProduct;
  /** Fired on every keystroke (no debounce) so the preview card can update live. */
  onLiveChange?: (fields: { title: string; description: string }) => void;
}) {
  const updateProduct = useUpdateProduct(storeId, product.id);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultValues: ProductEditFormInput = {
    title: product.title,
    description: product.description,
    leadTimeDays: product.leadTimeDays ?? undefined,
    primaryCategoryId: product.primaryCategoryId ?? "",
  };

  const {
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProductEditFormInput>({
    resolver: zodResolver(productEditFormSchema),
    defaultValues,
  });

  // Keep the form in sync if the product refetches under us (e.g. after a
  // status transition elsewhere on the page) without clobbering unsaved edits.
  useEffect(() => {
    if (!isDirty) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.title, product.description, product.leadTimeDays, product.primaryCategoryId]);

  async function persist(values: ProductEditFormInput) {
    setSaveStatus("saving");
    try {
      await updateProduct.mutateAsync({
        title: values.title,
        description: values.description,
        leadTimeDays: values.leadTimeDays,
        primaryCategoryId: values.primaryCategoryId || undefined,
      });
      reset(values);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  // Autosave: debounced, fires only once the current values pass
  // validation — an invalid in-progress edit (e.g. title mid-delete,
  // temporarily under the 3-character minimum) is never silently persisted.
  useEffect(() => {
    const subscription = watch((values) => {
      onLiveChange?.({ title: values.title ?? "", description: values.description ?? "" });

      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      setSaveStatus((prev) => (prev === "saving" ? prev : "pending"));

      autosaveTimer.current = setTimeout(() => {
        productEditFormSchema.safeParseAsync(values).then((result) => {
          if (result.success) void persist(result.data);
        });
      }, AUTOSAVE_DELAY_MS);
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  // Still protects the brief autosave-pending window (and the rare case a
  // debounced save is mid-flight) against an accidental tab close.
  useUnsavedChangesWarning(saveStatus === "pending" || saveStatus === "saving");

  const statusLabel: Record<SaveStatus, string | null> = {
    idle: null,
    pending: "Unsaved changes",
    saving: "Saving…",
    saved: "All changes saved",
    error: null,
  };

  return (
    <form onSubmit={handleSubmit(persist)} noValidate className="flex flex-col gap-[var(--space-300)]">
      {saveStatus === "error" ? (
        <Alert variant="error" title="Couldn't save changes">
          {updateProduct.error instanceof ApiError
            ? updateProduct.error.message
            : "Something went wrong. Please try again."}
        </Alert>
      ) : null}

      <FormField id="edit-title" label="Title" required error={errors.title?.message}>
        <Input {...register("title")} />
      </FormField>

      <FormField id="edit-description" label="Description" required error={errors.description?.message}>
        <Textarea {...register("description")} rows={5} />
      </FormField>

      <FormField id="edit-leadTimeDays" label="Lead time (days)" error={errors.leadTimeDays?.message}>
        <Input type="number" min={0} {...register("leadTimeDays", { valueAsNumber: true })} />
      </FormField>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSubmitting || updateProduct.isPending} className="self-start">
          Save now
        </Button>
        {statusLabel[saveStatus] ? (
          <span className="text-[13px] text-text-secondary" role="status" aria-live="polite">
            {statusLabel[saveStatus]}
          </span>
        ) : null}
      </div>
    </form>
  );
}
