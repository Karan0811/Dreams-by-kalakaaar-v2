"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import {
  useDeleteProductMedia,
  useUpdateProductMedia,
  useUploadProductImage,
  ApiError,
} from "@dbk/api-client";
import type { CreatorProductMedia } from "@dbk/types";
import { Alert, Button, Card } from "@dbk/ui";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Please choose a JPEG, PNG, or WEBP image.";
  if (file.size > MAX_SIZE_BYTES) return "Images must be under 10MB.";
  return null;
}

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
  const reorderMedia = useUpdateProductMedia(storeId, productId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Local order, updated immediately on drag/keyboard reorder so the grid
  // never waits on a round-trip; useUpdateProductMedia persists it after.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  const sorted = (() => {
    const byId = new Map(media.map((m) => [String(m.id), m]));
    if (localOrder) {
      const ordered = localOrder.map((id) => byId.get(id)).filter((m): m is CreatorProductMedia => Boolean(m));
      // Any item not in localOrder (e.g. just uploaded) goes at the end.
      const missing = media.filter((m) => !localOrder.includes(String(m.id)));
      return [...ordered, ...missing];
    }
    return [...media].sort((a, b) => a.displayOrder - b.displayOrder);
  })();

  function uploadFile(file: File) {
    setLocalError(null);
    const error = validateFile(file);
    if (error) {
      setLocalError(error);
      return;
    }
    upload.mutate({ file, altText: file.name.replace(/\.[^.]+$/, ""), isPrimary: media.length === 0 });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) uploadFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function persistOrder(newOrder: CreatorProductMedia[]) {
    setLocalOrder(newOrder.map((m) => m.id));
    newOrder.forEach((item, index) => {
      if (item.displayOrder !== index) {
        reorderMedia.mutate({ productMediaId: item.id, displayOrder: index });
      }
    });
  }

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= sorted.length) return;
    const next = [...sorted];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    persistOrder(next);
  }

  function handleItemDrop(targetIndex: number) {
    if (!draggedId) return;
    const fromIndex = sorted.findIndex((m) => m.id === draggedId);
    if (fromIndex === -1 || fromIndex === targetIndex) {
      setDraggedId(null);
      return;
    }
    moveItem(fromIndex, targetIndex);
    setDraggedId(null);
  }

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
          {sorted.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleItemDrop(index)}
              onDragEnd={() => setDraggedId(null)}
              className={`group relative aspect-square cursor-grab overflow-hidden rounded-[var(--radius-200)] border bg-background-subtle active:cursor-grabbing ${
                draggedId === item.id ? "opacity-50" : "border-border"
              }`}
            >
              {item.publicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- creator-only tool, arbitrary uploaded-image host, not worth Next/Image's remotePatterns config here
                <img src={item.publicUrl} alt={item.altText ?? ""} className="pointer-events-none size-full object-cover" />
              ) : null}
              {item.isPrimary ? (
                <span className="absolute left-1 top-1 rounded bg-brand-primary px-1.5 py-0.5 text-[10px] font-medium text-text-on-brand">
                  Primary
                </span>
              ) : null}

              {/* Keyboard-accessible reorder controls — dragging alone isn't operable
                  without a pointer, so every position also has this fallback. */}
              <div className="absolute bottom-1 left-1 flex gap-0.5 opacity-0 focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => moveItem(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Move photo ${index + 1} earlier`}
                  className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-30"
                >
                  <ArrowLeft className="size-3" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, index + 1)}
                  disabled={index === sorted.length - 1}
                  aria-label={`Move photo ${index + 1} later`}
                  className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-30"
                >
                  <ArrowRight className="size-3" aria-hidden />
                </button>
              </div>

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

      {/* Drag-and-drop upload target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-2 rounded-[var(--radius-200)] border-2 border-dashed p-[var(--space-300)] text-center transition-colors ${
          isDraggingFile ? "border-brand-primary bg-brand-primary/5" : "border-border"
        }`}
      >
        <UploadCloud className="size-6 text-text-secondary" aria-hidden />
        <p className="text-[13px] text-text-secondary">Drag a photo here, or</p>
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
          onClick={() => fileInputRef.current?.click()}
          isLoading={upload.isPending}
        >
          <ImagePlus className="size-4" aria-hidden />
          Choose a file
        </Button>
      </div>
    </Card>
  );
}
