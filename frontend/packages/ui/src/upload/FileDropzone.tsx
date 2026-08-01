"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@dbk/utils";

export interface FileDropzoneProps {
  onFilesSelected: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}

/**
 * Drag-and-drop (and click-to-browse) file picker. Purely a selection
 * surface — it has no idea what happens to the files afterward; pair it
 * with `useFileUpload` for the actual queue/progress/retry state.
 */
export function FileDropzone({
  onFilesSelected,
  accept,
  multiple = true,
  disabled = false,
  label = "Drag and drop images, or click to browse",
  hint,
  className,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) onFilesSelected(files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragActive(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-300)] border-2 border-dashed px-[var(--space-300)] py-[var(--space-600)] text-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
        isDragActive ? "border-brand-primary bg-brand-primary/5" : "border-border-strong hover:border-brand-primary",
        disabled && "cursor-not-allowed opacity-[var(--opacity-disabled)]",
        className,
      )}
    >
      <UploadCloud className="size-8 text-text-secondary" aria-hidden />
      <p className="text-[14px] font-medium text-text-primary">{label}</p>
      {hint ? <p className="text-[12px] text-text-secondary">{hint}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
