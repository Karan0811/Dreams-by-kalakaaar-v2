"use client";

import * as React from "react";
import { X } from "lucide-react";
import { ResponsiveGrid } from "../layout/ResponsiveGrid";
import { useImagePreview } from "../hooks/useImagePreview";

export interface ImagePreviewGridItem {
  id: string;
  file: File;
}

export interface ImagePreviewGridProps {
  items: ImagePreviewGridItem[];
  onRemove: (id: string) => void;
}

function PreviewTile({ item, onRemove }: { item: ImagePreviewGridItem; onRemove: (id: string) => void }) {
  const previewUrl = useImagePreview(item.file);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-[var(--radius-200)] border border-border bg-background-subtle">
      {previewUrl ? (
        // Plain <img>, not next/image's Image: this is an ephemeral local
        // blob: URL preview, not an optimizable remote asset.
        <img src={previewUrl} alt="" className="size-full object-cover" />
      ) : null}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label="Remove image"
        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-[var(--color-overlay-scrim)] text-[var(--color-neutral-000)] opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-000)] group-hover:opacity-100"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/** A grid of selected-but-not-yet-uploaded (or already uploaded) image
 * previews, each removable — e.g. the Creator Product form's photo
 * picker. For upload-in-progress state (progress bars, retry), use
 * `UploadProgressItem` in a list instead; this component is specifically
 * the "here's what you've picked" grid view. */
export function ImagePreviewGrid({ items, onRemove }: ImagePreviewGridProps) {
  return (
    <ResponsiveGrid cols={{ base: 3, sm: 4, md: 5 }} gap="150">
      {items.map((item) => (
        <PreviewTile key={item.id} item={item} onRemove={onRemove} />
      ))}
    </ResponsiveGrid>
  );
}
