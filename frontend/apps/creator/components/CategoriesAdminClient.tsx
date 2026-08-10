"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@dbk/api-client";
import type { CategoryNode } from "@dbk/types";
import {
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
  toast,
} from "@dbk/ui";

const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(128),
  description: z.string().trim().max(2000).optional(),
  parentId: z.string().optional(),
});
type CategoryFormInput = z.infer<typeof categoryFormSchema>;

function CategoryFormDialog({
  open,
  onOpenChange,
  editing,
  topLevelCategories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CategoryNode | null;
  topLevelCategories: CategoryNode[];
}) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: editing
      ? { name: editing.name, description: editing.description ?? "", parentId: editing.parentId ?? "" }
      : { name: "", description: "", parentId: "" },
  });

  async function onSubmit(values: CategoryFormInput) {
    try {
      if (editing) {
        await updateCategory.mutateAsync({
          categoryId: editing.id,
          name: values.name,
          description: values.description,
        });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync({
          name: values.name,
          description: values.description,
          parentId: values.parentId || undefined,
        });
        toast.success("Category created");
      }
      onOpenChange(false);
      reset();
    } catch {
      toast.error("Couldn't save this category. It may already exist.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--space-200)]">
          <FormField id="name" label="Name" error={errors.name?.message} required>
            <Input {...register("name")} />
          </FormField>
          <FormField id="description" label="Description" error={errors.description?.message}>
            <Textarea rows={3} {...register("description")} />
          </FormField>
          {!editing ? (
            <FormField id="parentId" label="Parent category">
              <Select value={watch("parentId") || "none"} onValueChange={(v) => setValue("parentId", v === "none" ? "" : v)}>
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="None (top-level category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level category)</SelectItem>
                  {topLevelCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}
          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
            {editing ? "Save changes" : "Create Category"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriesAdminClient() {
  const { data: categories, isLoading, isError, refetch } = useCategories({ flat: true });
  const deleteCategory = useDeleteCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryNode | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError) return <ErrorState description="We couldn't load categories." onRetry={() => refetch()} />;

  const topLevel = (categories ?? []).filter((c) => !c.parentId);
  const childrenOf = (parentId: string) => (categories ?? []).filter((c) => c.parentId === parentId);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteCategory.mutateAsync(pendingDelete.id);
      toast.success("Category deleted");
    } catch {
      toast.error("Couldn't delete this category. It may still have subcategories or products.");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-[22px] text-text-primary">Categories</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden /> New Category
        </Button>
      </div>

      {topLevel.length === 0 ? (
        <EmptyState icon={FolderTree} title="No categories yet" description="Create your first top-level category to organize products." />
      ) : (
        <div className="flex flex-col gap-3">
          {topLevel.map((category) => (
            <Card key={category.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-medium text-text-primary">{category.name}</p>
                <div className="flex gap-1">
                  <Button
                    variant="tertiary"
                    size="sm"
                    aria-label="Edit category"
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button variant="tertiary" size="sm" aria-label="Delete category" onClick={() => setPendingDelete(category)}>
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
              {childrenOf(category.id).length > 0 ? (
                <ul className="ml-[var(--space-300)] flex flex-col gap-1 border-l border-border pl-[var(--space-200)]">
                  {childrenOf(category.id).map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between">
                      <span className="text-[13px] text-text-secondary">{sub.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="tertiary"
                          size="sm"
                          aria-label="Edit subcategory"
                          onClick={() => {
                            setEditing(sub);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                        <Button variant="tertiary" size="sm" aria-label="Delete subcategory" onClick={() => setPendingDelete(sub)}>
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} topLevelCategories={topLevel} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This can't be undone. Categories with subcategories or products can't be deleted."
        destructive
        isConfirming={deleteCategory.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
