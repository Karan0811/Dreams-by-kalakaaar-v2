"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productEditFormSchema, type ProductEditFormInput } from "@dbk/utils";
import { useUpdateProduct, ApiError } from "@dbk/api-client";
import type { CreatorProduct } from "@dbk/types";
import { Alert, Button, FormField, Input, Textarea } from "@dbk/ui";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

export function ProductEditForm({ storeId, product }: { storeId: string; product: CreatorProduct }) {
  const updateProduct = useUpdateProduct(storeId, product.id);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProductEditFormInput>({
    resolver: zodResolver(productEditFormSchema),
    defaultValues: {
      title: product.title,
      description: product.description,
      leadTimeDays: product.leadTimeDays ?? undefined,
      primaryCategoryId: product.primaryCategoryId ?? "",
    },
  });

  // Keep the form in sync if the product refetches under us (e.g. after a
  // status transition elsewhere on the page) without clobbering unsaved edits.
  useEffect(() => {
    if (!isDirty) {
      reset({
        title: product.title,
        description: product.description,
        leadTimeDays: product.leadTimeDays ?? undefined,
        primaryCategoryId: product.primaryCategoryId ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.title, product.description, product.leadTimeDays, product.primaryCategoryId]);

  useUnsavedChangesWarning(isDirty && !isSubmitting);

  async function onSubmit(values: ProductEditFormInput) {
    await updateProduct.mutateAsync({
      title: values.title,
      description: values.description,
      leadTimeDays: values.leadTimeDays,
      primaryCategoryId: values.primaryCategoryId || undefined,
    });
    reset(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--space-300)]">
      {updateProduct.isError ? (
        <Alert variant="error" title="Couldn't save changes">
          {updateProduct.error instanceof ApiError
            ? updateProduct.error.message
            : "Something went wrong. Please try again."}
        </Alert>
      ) : null}
      {updateProduct.isSuccess && !isDirty ? (
        <Alert variant="success" title="Saved" />
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

      <Button type="submit" isLoading={isSubmitting || updateProduct.isPending} disabled={!isDirty} className="self-start">
        Save changes
      </Button>
    </form>
  );
}
