"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  useCreatorAddresses,
  useCreateCreatorAddress,
  useUpdateCreatorAddress,
  useDeleteCreatorAddress,
} from "@dbk/api-client";
import { pinCodeSchema } from "@dbk/utils";
import type { CreatorAddress } from "@dbk/types";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
} from "@dbk/ui";

const TYPE_LABEL: Record<CreatorAddress["type"], string> = {
  REGISTERED: "Registered",
  WAREHOUSE: "Warehouse",
  RETURN: "Return",
};

const addressFormSchema = z.object({
  type: z.enum(["REGISTERED", "WAREHOUSE", "RETURN"]),
  line1: z.string().trim().min(3, "Address is required").max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2, "City is required").max(128),
  state: z.string().trim().min(2, "State is required").max(128),
  postalCode: pinCodeSchema,
  isDefault: z.boolean(),
});
type AddressFormInput = z.infer<typeof addressFormSchema>;

function AddressFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CreatorAddress | null;
}) {
  const createAddress = useCreateCreatorAddress();
  const updateAddress = useUpdateCreatorAddress();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormInput>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: editing
      ? {
          type: editing.type,
          line1: editing.line1,
          line2: editing.line2 ?? "",
          city: editing.city,
          state: editing.state,
          postalCode: editing.postalCode,
          isDefault: editing.isDefault,
        }
      : { type: "REGISTERED", isDefault: false },
  });

  async function onSubmit(values: AddressFormInput) {
    try {
      if (editing) {
        await updateAddress.mutateAsync({ addressId: editing.id, ...values });
        toast.success("Address updated");
      } else {
        await createAddress.mutateAsync(values);
        toast.success("Address added");
      }
      onOpenChange(false);
      reset();
    } catch {
      toast.error("Couldn't save this address. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit address" : "Add an address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--space-200)]">
          <FormField id="type" label="Address type" required>
            <Select value={watch("type")} onValueChange={(v) => setValue("type", v as AddressFormInput["type"])}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REGISTERED">Registered</SelectItem>
                <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="line1" label="Address line 1" error={errors.line1?.message} required>
            <Input {...register("line1")} />
          </FormField>
          <FormField id="line2" label="Address line 2" error={errors.line2?.message}>
            <Input {...register("line2")} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="city" label="City" error={errors.city?.message} required>
              <Input {...register("city")} />
            </FormField>
            <FormField id="state" label="State" error={errors.state?.message} required>
              <Input {...register("state")} />
            </FormField>
          </div>
          <FormField id="postalCode" label="PIN code" error={errors.postalCode?.message} required>
            <Input {...register("postalCode")} />
          </FormField>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isDefault"
              checked={watch("isDefault")}
              onCheckedChange={(checked) => setValue("isDefault", checked === true)}
            />
            <Label htmlFor="isDefault" className="font-normal">
              Set as default address
            </Label>
          </div>
          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
            {editing ? "Save changes" : "Add address"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreatorAddressesSection() {
  const { data: addresses, isLoading, isError, refetch } = useCreatorAddresses();
  const deleteAddress = useDeleteCreatorAddress();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CreatorAddress | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CreatorAddress | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteAddress.mutateAsync(pendingDelete.id);
      toast.success("Address removed");
    } catch {
      toast.error("Couldn't remove this address. Please try again.");
    } finally {
      setPendingDelete(null);
    }
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) return <ErrorState description="We couldn't load your addresses." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-medium text-text-primary">Addresses</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden /> Add Address
        </Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No addresses on file" description="Add your registered, warehouse, or return addresses." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{TYPE_LABEL[address.type]}</Badge>
                  {address.isDefault ? (
                    <Badge variant="info">
                      <Star className="size-3" aria-hidden /> Default
                    </Badge>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="tertiary"
                    size="sm"
                    aria-label="Edit address"
                    onClick={() => {
                      setEditing(address);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button variant="tertiary" size="sm" aria-label="Delete address" onClick={() => setPendingDelete(address)}>
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
              <p className="text-[13px] text-text-secondary">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}
              </p>
            </Card>
          ))}
        </div>
      )}

      <AddressFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this address?"
        description="This can't be undone."
        destructive
        isConfirming={deleteAddress.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
