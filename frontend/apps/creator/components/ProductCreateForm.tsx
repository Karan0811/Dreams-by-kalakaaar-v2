"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { productFormSchema, toMinorUnits, type ProductFormInput } from "@dbk/utils";
import { useCreateProduct, ApiError } from "@dbk/api-client";
import { Alert, Button, FormField, Input, Label, Textarea } from "@dbk/ui";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

export function ProductCreateForm({ storeId }: { storeId: string }) {
  const router = useRouter();
  const createProduct = useCreateProduct(storeId);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productType: "READY_MADE",
      variants: [{ priceAmount: 0, initialQuantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const confirmDiscard = useUnsavedChangesWarning(isDirty && !isSubmitting);

  async function onSubmit(values: ProductFormInput) {
    try {
      const product = await createProduct.mutateAsync({
        title: values.title,
        description: values.description,
        productType: values.productType,
        leadTimeDays: values.leadTimeDays,
        primaryCategoryId: values.primaryCategoryId || undefined,
        variants: values.variants.map((v) => ({
          priceAmount: v.priceAmount,
          skuReference: v.skuReference || undefined,
          initialQuantity: v.initialQuantity,
        })),
      });
      router.push(`/dashboard/products/${product.id}/edit?created=true`);
    } catch {
      // surfaced below via createProduct.error
    }
  }

  function handleCancel() {
    if (confirmDiscard()) router.push("/dashboard/products");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-2xl flex-col gap-[var(--space-400)]">
      {createProduct.isError ? (
        <Alert variant="error" title="Couldn't create this product">
          {createProduct.error instanceof ApiError
            ? createProduct.error.message
            : "Something went wrong. Please try again."}
        </Alert>
      ) : null}

      <FormField id="title" label="Title" required error={errors.title?.message}>
        <Input {...register("title")} placeholder="Hand-thrown ceramic mug" />
      </FormField>

      <FormField id="description" label="Description" required error={errors.description?.message}>
        <Textarea {...register("description")} rows={5} placeholder="What makes this piece special…" />
      </FormField>

      <div className="grid grid-cols-2 gap-[var(--space-300)]">
        <div className="flex flex-col gap-[var(--space-050)]">
          <Label htmlFor="productType">Product type</Label>
          <select
            id="productType"
            {...register("productType")}
            className="min-h-[var(--size-touch-target-min)] rounded-md border border-border bg-surface px-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          >
            <option value="READY_MADE">Ready-made</option>
            <option value="MADE_TO_ORDER">Made to order</option>
          </select>
        </div>

        {watch("productType") === "MADE_TO_ORDER" ? (
          <FormField id="leadTimeDays" label="Lead time (days)" error={errors.leadTimeDays?.message}>
            <Input type="number" min={0} {...register("leadTimeDays", { valueAsNumber: true })} />
          </FormField>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-[var(--space-300)]">
        <legend className="mb-1 text-[15px] font-medium text-text-primary">Variants</legend>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-end gap-2 rounded-[var(--radius-200)] border border-border p-[var(--space-200)]"
          >
            <FormField
              id={`variants.${index}.priceAmount`}
              label="Price (₹)"
              required
              error={errors.variants?.[index]?.priceAmount?.message}
            >
              <Input
                type="number"
                min={0}
                step="1"
                {...register(`variants.${index}.priceAmount`, {
                  setValueAs: (v: string) => (v === "" ? undefined : toMinorUnits(Number(v))),
                })}
              />
            </FormField>
            <FormField
              id={`variants.${index}.skuReference`}
              label="SKU (optional)"
              error={errors.variants?.[index]?.skuReference?.message}
            >
              <Input {...register(`variants.${index}.skuReference`)} />
            </FormField>
            <FormField
              id={`variants.${index}.initialQuantity`}
              label="Starting stock"
              error={errors.variants?.[index]?.initialQuantity?.message}
            >
              <Input
                type="number"
                min={0}
                {...register(`variants.${index}.initialQuantity`, { valueAsNumber: true })}
              />
            </FormField>
            {fields.length > 1 ? (
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => remove(index)}
                aria-label={`Remove variant ${index + 1}`}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        ))}
        {errors.variants?.root ? (
          <p role="alert" className="text-[12px] text-error">
            {errors.variants.root.message}
          </p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ priceAmount: 0, initialQuantity: 0 })}
          className="self-start"
        >
          <Plus className="size-4" aria-hidden />
          Add variant
        </Button>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting || createProduct.isPending}>
          Create product
        </Button>
        <Button type="button" variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
