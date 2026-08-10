"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, CreditCard, Plus, Star, Trash2 } from "lucide-react";
import {
  useCreatorBankDetails,
  useCreateCreatorBankDetail,
  useDeleteCreatorBankDetail,
} from "@dbk/api-client";
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
  Skeleton,
  toast,
} from "@dbk/ui";
import type { CreatorBankDetail } from "@dbk/types";

const bankFormSchema = z.object({
  accountHolderName: z.string().trim().min(2).max(255),
  accountNumber: z.string().trim().min(6, "Enter a valid account number").max(34),
  ifscCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
  bankName: z.string().trim().min(2).max(255),
  branchName: z.string().trim().max(255).optional(),
  isPrimary: z.boolean(),
});
type BankFormInput = z.infer<typeof bankFormSchema>;

function BankDetailFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createBankDetail = useCreateCreatorBankDetail();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BankFormInput>({ resolver: zodResolver(bankFormSchema), defaultValues: { isPrimary: true } });

  async function onSubmit(values: BankFormInput) {
    try {
      await createBankDetail.mutateAsync(values);
      toast.success("Bank details added");
      onOpenChange(false);
      reset();
    } catch {
      toast.error("Couldn't save your bank details. Please check the IFSC code and try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add bank details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--space-200)]">
          <FormField id="accountHolderName" label="Account holder name" error={errors.accountHolderName?.message} required>
            <Input {...register("accountHolderName")} />
          </FormField>
          <FormField id="accountNumber" label="Account number" error={errors.accountNumber?.message} required>
            <Input {...register("accountNumber")} />
          </FormField>
          <FormField id="ifscCode" label="IFSC code" error={errors.ifscCode?.message} required>
            <Input {...register("ifscCode")} className="uppercase" />
          </FormField>
          <FormField id="bankName" label="Bank name" error={errors.bankName?.message} required>
            <Input {...register("bankName")} />
          </FormField>
          <FormField id="branchName" label="Branch name" error={errors.branchName?.message}>
            <Input {...register("branchName")} />
          </FormField>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isPrimary"
              checked={watch("isPrimary")}
              onCheckedChange={(checked) => setValue("isPrimary", checked === true)}
            />
            <Label htmlFor="isPrimary" className="font-normal">
              Set as primary payout account
            </Label>
          </div>
          <p className="text-[12px] text-text-secondary">
            Your account number is encrypted and never displayed again after saving — only the last 4 digits are shown.
          </p>
          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
            Save Bank Details
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreatorBankDetailsSection() {
  const { data: bankDetails, isLoading, isError, refetch } = useCreatorBankDetails();
  const deleteBankDetail = useDeleteCreatorBankDetail();
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CreatorBankDetail | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteBankDetail.mutateAsync(pendingDelete.id);
      toast.success("Bank details removed");
    } catch {
      toast.error("Couldn't remove these bank details. Please try again.");
    } finally {
      setPendingDelete(null);
    }
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) return <ErrorState description="We couldn't load your bank details." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-medium text-text-primary">Bank Details</h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" aria-hidden /> Add Bank Account
        </Button>
      </div>

      {!bankDetails || bankDetails.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payout account on file" description="Add a bank account so we know where to send your earnings." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bankDetails.map((detail) => (
            <Card key={detail.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {detail.isPrimary ? (
                    <Badge variant="info">
                      <Star className="size-3" aria-hidden /> Primary
                    </Badge>
                  ) : null}
                  {detail.isVerified ? (
                    <Badge variant="success">
                      <CheckCircle2 className="size-3" aria-hidden /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="neutral">Pending verification</Badge>
                  )}
                </div>
                <Button variant="tertiary" size="sm" aria-label="Delete bank details" onClick={() => setPendingDelete(detail)}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <p className="text-[14px] font-medium text-text-primary">{detail.accountHolderName}</p>
              <p className="text-[13px] text-text-secondary">
                {detail.bankName} •••• {detail.accountNumberLast4}
              </p>
              {detail.branchName ? <p className="text-[13px] text-text-secondary">{detail.branchName}</p> : null}
            </Card>
          ))}
        </div>
      )}

      <BankDetailFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete these bank details?"
        description="This can't be undone."
        destructive
        isConfirming={deleteBankDetail.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
