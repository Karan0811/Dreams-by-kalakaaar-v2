"use client";

import { useRef, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import {
  useCreatorDocuments,
  useRequestCreatorDocumentUpload,
  useCreateCreatorDocument,
  useDeleteCreatorDocument,
} from "@dbk/api-client";
import { Badge, Button, Card, EmptyState, ErrorState, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, toast } from "@dbk/ui";
import type { CreatorDocumentStatus, CreatorDocumentType } from "@dbk/types";

const DOCUMENT_TYPES: { value: CreatorDocumentType; label: string }[] = [
  { value: "GOVERNMENT_ID", label: "Government ID" },
  { value: "BUSINESS_REGISTRATION", label: "Business Registration" },
  { value: "TAX_CERTIFICATE", label: "Tax Certificate" },
  { value: "BANK_PROOF", label: "Bank Proof" },
  { value: "ADDRESS_PROOF", label: "Address Proof" },
  { value: "OTHER", label: "Other" },
];

const STATUS_BADGE: Record<CreatorDocumentStatus, { label: string; variant: "neutral" | "success" | "error" }> = {
  PENDING_REVIEW: { label: "Pending review", variant: "neutral" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "error" },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function CreatorDocumentsSection() {
  const { data: documents, isLoading, isError, refetch } = useCreatorDocuments();
  const requestUpload = useRequestCreatorDocumentUpload();
  const createDocument = useCreateCreatorDocument();
  const deleteDocument = useDeleteCreatorDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<CreatorDocumentType>("GOVERNMENT_ID");
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("This file is too large. Please choose a file under 10MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, WebP, or PDF file.");
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, mediaId } = await requestUpload.mutateAsync({
        fileName: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
        sizeBytes: file.size,
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("Upload failed");

      await createDocument.mutateAsync({ mediaId, type: documentType });
      toast.success("Document uploaded and submitted for review");
    } catch {
      toast.error("Couldn't upload this document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) return <ErrorState description="We couldn't load your documents." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <h2 className="text-[16px] font-medium text-text-primary">Documents</h2>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Select value={documentType} onValueChange={(v) => setDocumentType(v as CreatorDocumentType)}>
          <SelectTrigger className="sm:w-56" aria-label="Document type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileSelected}
        />
        <Button isLoading={isUploading} onClick={() => fileInputRef.current?.click()}>
          <Upload className="size-4" aria-hidden /> Upload Document
        </Button>
      </div>

      {!documents || documents.length === 0 ? (
        <EmptyState icon={FileText} title="No documents uploaded" description="Upload your ID, business registration, or other verification documents." />
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((document) => (
            <li key={document.id}>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-text-primary">
                    {DOCUMENT_TYPES.find((t) => t.value === document.type)?.label ?? document.type}
                  </p>
                  {document.reviewNotes ? (
                    <p className="mt-0.5 text-[12px] text-text-secondary">{document.reviewNotes}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE[document.status].variant}>{STATUS_BADGE[document.status].label}</Badge>
                  {document.status === "PENDING_REVIEW" ? (
                    <Button
                      variant="tertiary"
                      size="sm"
                      aria-label="Delete document"
                      onClick={() =>
                        deleteDocument.mutate(document.id, {
                          onSuccess: () => toast.success("Document removed"),
                          onError: () => toast.error("Couldn't remove this document. Please try again."),
                        })
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
