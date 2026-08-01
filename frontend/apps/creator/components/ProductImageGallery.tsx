"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { useDeleteProductMedia, useUploadProductImage, ApiError } from "@dbk/api-client";
import type { CreatorProductMedia } from "@dbk/types";
import { Alert, Button, Card } from "@dbk/ui";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export function ProductImageGallery({
  storeId,
  productId,
  media,
}: {
  storeId: string;
  productId: string;
  media: CreatorProductMedia[];
}) {
  const upload = useUploadProductImage(storeId, productId);
  const deleteMedia = useDeleteProductMedia(storeId, productId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLocalError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Please choose a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setLocalError("Images must be under 10MB.");
      return;
    }

    upload.mutate({ file, altText: file.name.replace(/\.[^.]+$/, ""), isPrimary: media.length === 0 });
  }

  const sorted = [...media].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Card className="flex flex-col gap-[var(--space-200)]">
      <p className="text-[13px] font-medium text-text-secondary">Photos</p>

      {(localError || upload.isError) && (
        <Alert variant="error" title="Couldn't add this photo">
          {localError ?? (upload.error instanceof ApiError ? upload.error.message : "Please try again.")}
        </Alert>
      )}

      {sorted.length === 0 ? (
        <p className="text-[13px] text-text-secondary">
          No photos yet. At least one is required before you can publish.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {sorted.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-[var(--radius-200)] border border-border bg-background-subtle">
              {item.publicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- creator-only tool, arbitrary uploaded-image host, not worth Next/Image's remotePatterns config here
                <img src={item.publicUrl} alt={item.altText ?? ""} className="size-full object-cover" />
              ) : null}
              {item.isPrimary ? (
                <span className="absolute left-1 top-1 rounded bg-brand-primary px-1.5 py-0.5 text-[10px] font-medium text-text-on-brand">
                  Primary
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => deleteMedia.mutate(item.id)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileChange}
        className="sr-only"
        id="product-photo-upload"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => fileInputRef.current?.click()}
        isLoading={upload.isPending}
      >
        <ImagePlus className="size-4" aria-hidden />
        Add photo
      </Button>
    </Card>
  );
}
