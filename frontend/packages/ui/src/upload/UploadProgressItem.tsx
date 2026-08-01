"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, X, RotateCw } from "lucide-react";
import { cn, formatFileSize } from "@dbk/utils";
import type { UploadFileEntry } from "../hooks/useFileUpload";
import { Progress } from "../primitives/Progress";
import { useImagePreview } from "../hooks/useImagePreview";

export interface UploadProgressItemProps {
  entry: UploadFileEntry;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

/** One row for a file in a `useFileUpload` queue. Shows a live thumbnail
 * (via `useImagePreview`) when the file is an image, the filename and
 * size, a progress bar while uploading, and a retry/remove action
 * depending on status. */
export function UploadProgressItem({ entry, onRemove, onRetry }: UploadProgressItemProps) {
  const isImage = entry.file.type.startsWith("image/");
  const previewUrl = useImagePreview(isImage ? entry.file : null);

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-200)] border border-border bg-surface p-[var(--space-150)]">
      {previewUrl ? (
        // Plain <img>, not next/image's Image: this is an ephemeral local
        // blob: URL preview, not an optimizable remote asset.
        <img src={previewUrl} alt="" className="size-10 shrink-0 rounded-[var(--radius-100)] object-cover" />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-100)] bg-background-subtle text-[10px] font-medium text-text-secondary">
          {entry.file.name.split(".").pop()?.toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-text-primary">{entry.file.name}</p>
        <p className="text-[12px] text-text-secondary">{formatFileSize(entry.file.size)}</p>
        {entry.status === "uploading" ? <Progress value={entry.progress} className="mt-1.5 h-1" /> : null}
        {entry.status === "error" && entry.error ? (
          <p className="mt-1 flex items-center gap-1 text-[12px] text-error">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            {entry.error}
          </p>
        ) : null}
      </div>

      {entry.status === "success" ? (
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Uploaded" />
      ) : entry.status === "error" ? (
        <button
          type="button"
          onClick={() => onRetry(entry.id)}
          aria-label={`Retry uploading ${entry.file.name}`}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-background-subtle hover:text-text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
          )}
        >
          <RotateCw className="size-4" aria-hidden />
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        aria-label={`Remove ${entry.file.name}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-background-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
